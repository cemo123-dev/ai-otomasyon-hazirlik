// Tetikleyici: halftime_jobs INSERT → pg_net → bu fonksiyon (bkz. 0006_halftime.sql)
// Canlı Devre Arası "Soyunma Odası Reçetesi": maç başına tek Gemini çağrısı + takipçilere push.
// İstek bütçesi: 1 API-Football isteği (/fixtures?id= → durum, ilk yarı istatistikleri, olaylar, diziliş)
import { apiGet, mapCore, mapDetails } from '../_shared/apiFootball.ts';
import { generateJson } from '../_shared/gemini.ts';
import {
  assembleHalftime,
  buildHalftimeFacts,
  buildHalftimeInput,
  HALFTIME_PUSH_TITLE,
  HALFTIME_SCHEMA,
  HALFTIME_SYSTEM_INSTRUCTION,
  type HalftimeLlmOut,
} from '../_shared/halftime.ts';
import { notifyFollowers } from '../_shared/notify.ts';
import { storeLineupFields } from '../_shared/lineups.ts';
import { admin, authorized, json } from '../_shared/supabaseAdmin.ts';

const KEY = Deno.env.get('API_FOOTBALL_KEY')!;
const MODEL = Deno.env.get('GEMINI_MODEL') ?? 'gemini-3.5-flash-lite';
// ~150 kelime Türkçe ≈ 300-400 token; şema anahtarlarıyla birlikte sınır
const MAX_OUTPUT_TOKENS = Number(Deno.env.get('HALFTIME_MAX_OUTPUT_TOKENS') ?? 500);

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  if (!(await authorized(req))) return json({ error: 'unauthorized' }, 401);
  const { fixture_id } = await req.json().catch(() => ({}));
  if (!Number.isInteger(fixture_id)) return json({ error: 'fixture_id' }, 400);

  const setStatus = (halftime_status: 'none' | 'failed') =>
    admin.from('matches').update({ halftime_status }).eq('fixture_id', fixture_id);
  const fail = async (reason: string, status: 'none' | 'failed' = 'failed') => {
    console.error(`[generate-halftime] ${fixture_id}: ${reason}`);
    await setStatus(status);
    return json({ ok: false, reason }, 200);
  };

  try {
    const { data: existing } = await admin.from('match_halftime_reports').select('fixture_id').eq('fixture_id', fixture_id).maybeSingle();
    if (existing) {
      await admin.from('matches').update({ halftime_status: 'completed' }).eq('fixture_id', fixture_id);
      return json({ ok: true, cached: true });
    }

    const { data: match } = await admin.from('matches').select('fixture_id, sport_type, league_name').eq('fixture_id', fixture_id).maybeSingle();
    if (!match || match.sport_type !== 'football') return fail('maç bulunamadı veya futbol değil');

    // 1) Gerçek durum + ilk yarı verisi (1 istek)
    const [f] = await apiGet(`/fixtures?id=${fixture_id}`, KEY);
    if (!f) return fail('maç API\'de bulunamadı');
    const status = f.fixture?.status?.short;

    // Veritabanını da tazele (ücretsiz planda durum 30 dk'ya kadar eski olabilir)
    await admin.from('matches').upsert({ ...mapCore(f), ...mapDetails(f) }, { onConflict: 'fixture_id' });
    await storeLineupFields(admin, [f]); // 0013: devre arası kadrosu (ayrı update; throw etmez)

    if (status === '1H') return fail('ilk yarı henüz bitmedi', 'none'); // tekrar denenebilir
    if (status !== 'HT') return fail(`devre arası değil (${status})`); // ikinci yarı başladı: kaçırıldı

    // 2) Deterministik olgular + tek Gemini çağrısı
    const facts = buildHalftimeFacts(f, match.league_name);
    const input = buildHalftimeInput(facts);
    const { data, usage } = await generateJson<HalftimeLlmOut>({
      apiKey: Deno.env.get('GEMINI_API_KEY')!,
      model: MODEL,
      system: HALFTIME_SYSTEM_INSTRUCTION,
      input,
      schema: HALFTIME_SCHEMA,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
    });
    const payload = assembleHalftime(facts, input, data);

    const { error: insErr } = await admin.from('match_halftime_reports').upsert({
      fixture_id,
      report_payload: payload,
      model: MODEL,
      input_tokens: usage.input,
      output_tokens: usage.output + usage.thought,
    });
    if (insErr) return fail(`kayıt hatası: ${insErr.message}`);
    await admin.from('matches').update({ halftime_status: 'completed', halftime_teaser: payload.teaser }).eq('fixture_id', fixture_id);

    // 3) Maçı takip edenlere push (bildirim metni ücretsiz teaser ile aynı: 0 token)
    const pushed = await notifyFollowers(fixture_id, 'halftime', HALFTIME_PUSH_TITLE, payload.teaser);

    console.log(`[generate-halftime] ${fixture_id} ok · in=${usage.input} out=${usage.output} · push=${pushed}`);
    return json({ ok: true, usage, pushed });
  } catch (e) {
    return fail(e instanceof Error ? e.message : String(e));
  }
});

