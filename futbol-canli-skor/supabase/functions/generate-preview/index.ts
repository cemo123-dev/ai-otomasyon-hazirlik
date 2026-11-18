// Tetikleyici: preview_jobs INSERT → pg_net → bu fonksiyon (bkz. 0005_prematch.sql)
// Maç öncesi "Taktiksel Eşleşme & Kırılma Senaryosu": maç başına tek Gemini çağrısı.
//
// İstek bütçesi:  ücretli plan  → ilk 11 (1) + sakatlar (1) + son 5 maç id'leri (2) + detaylar ids= (1) = 5
//                 ücretsiz plan → ilk 11 (1) + sakatlar (1); form kendi veritabanımızdan
import {
  getFixturesByIds,
  getInjuries,
  getLineups,
  getTeamLastFixtureIds,
  hasQuotaForOptional,
  lastQuotaRemaining,
  mapPlayerMatchRows,
  PAID,
  primeQuota,
  type PlayerMatchRow,
} from '../_shared/apiFootball.ts';
import { generateJson } from '../_shared/gemini.ts';
import {
  assemblePreview,
  buildPreviewInput,
  computeAbsences,
  computeMatchups,
  computeTeamForm,
  parseLineups,
  PREVIEW_SCHEMA,
  PREVIEW_SYSTEM_INSTRUCTION,
  teamSampleFromFixture,
  teamSampleFromRow,
  type PreviewFacts,
  type PreviewLlmOut,
  type TeamMatchSample,
} from '../_shared/preview.ts';
import { admin, authorized, json } from '../_shared/supabaseAdmin.ts';

const KEY = Deno.env.get('API_FOOTBALL_KEY')!;
const MODEL = Deno.env.get('GEMINI_MODEL') ?? 'gemini-3.5-flash-lite';
const MAX_OUTPUT_TOKENS = Number(Deno.env.get('GEMINI_MAX_OUTPUT_TOKENS') ?? 900);

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  if (!(await authorized(req))) return json({ error: 'unauthorized' }, 401);
  const { fixture_id } = await req.json().catch(() => ({}));
  if (!Number.isInteger(fixture_id)) return json({ error: 'fixture_id' }, 400);

  const fail = async (reason: string) => {
    console.error(`[generate-preview] ${fixture_id}: ${reason}`);
    await admin.from('matches').update({ preview_status: 'failed' }).eq('fixture_id', fixture_id);
    return json({ ok: false, reason }, 200); // RPC tekrar denemeye izin verir (preview_attempts < 4)
  };

  // İlk 11 henüz açıklanmadı: 'failed' yerine 'none' + deneme iadesi (kalıcı kilit olmasın).
  // preview_requested_at kalır: RPC 10 dk boyunca (0016; maç başına en fazla 4 ilk 11 sorgusu) 'not_ready' döner.
  // refundCheck: ilk 11 hiç sorulmadıysa (kota yolu) RPC'nin artırdığı preview_lineup_checks de iade edilir;
  // yoksa kota yüzünden 4 talepte maç kalıcı 'not_supported' olurdu (Döngü 4, bulgu 2).
  const notReady = async (reason: string, attempts: number | null | undefined, refundCheck = false) => {
    const patch: Record<string, unknown> = { preview_status: 'none', preview_attempts: Math.max(0, (attempts ?? 1) - 1) };
    if (refundCheck) {
      // Ayrı sorgu: 0016 kurulmamışsa kolon yoktur; hata yalnız sayaç iadesini atlar
      const { data, error } = await admin
        .from('matches')
        .select('preview_lineup_checks')
        .eq('fixture_id', fixture_id)
        .maybeSingle();
      const checks = (data as { preview_lineup_checks?: unknown } | null)?.preview_lineup_checks;
      if (!error && typeof checks === 'number') patch.preview_lineup_checks = Math.max(0, checks - 1);
    }
    console.warn(`[generate-preview] ${fixture_id}: ${reason} (deneme${refundCheck ? ' ve ilk 11 sorgu hakkı' : ''} iade edildi)`);
    await admin.from('matches').update(patch).eq('fixture_id', fixture_id);
    return json({ ok: false, reason, not_ready: true }, 200);
  };

  try {
    const { data: existing } = await admin.from('match_previews').select('fixture_id').eq('fixture_id', fixture_id).maybeSingle();
    if (existing) {
      await admin.from('matches').update({ preview_status: 'completed' }).eq('fixture_id', fixture_id);
      return json({ ok: true, cached: true });
    }

    const { data: match, error } = await admin
      .from('matches')
      .select('fixture_id, sport_type, league_name, kickoff_at, home_team, away_team, preview_attempts')
      .eq('fixture_id', fixture_id)
      .maybeSingle();
    if (error || !match) return fail('maç bulunamadı');
    if (match.sport_type !== 'football') return fail('yalnızca futbol destekleniyor');

    // Kota bekçisi: maç önü raporu isteğe bağlıdır; futbolun günlük sabit işlerinin rezervi yenmez
    // (NBA kotası ayrıdır). Maç başına ilk 11 sorgusu ayrıca request_match_preview'da sınırlıdır
    // (0016: en fazla 4, 10 dk arayla); burada sorgu atılmadığı için sorgu hakkı iade edilir.
    await primeQuota(KEY);
    if (!hasQuotaForOptional()) {
      return notReady(`kota rezervi korunuyor (kalan ${lastQuotaRemaining()})`, match.preview_attempts, true);
    }

    // 1) İlk 11'ler
    const lineups = parseLineups(await getLineups(fixture_id, KEY), match.home_team);
    if (!lineups) return notReady('ilk 11 henüz açıklanmadı', match.preview_attempts);

    // 2) Sakat/cezalılar (kapsama lige göre değişir; hata analizi durdurmaz; kota azsa atlanır)
    let injuries: unknown[] = [];
    if (hasQuotaForOptional()) {
      try {
        injuries = await getInjuries(fixture_id, KEY);
      } catch (e) {
        console.warn('[generate-preview] sakatlık verisi alınamadı:', e instanceof Error ? e.message : e);
      }
    } else {
      console.warn('[generate-preview] kota rezervi: sakatlık verisi atlandı');
    }

    // 3) Form: önce kendi veritabanımız, eksikse (ücretli planda) API
    const teamIds = [lineups.home.team_id, lineups.away.team_id];
    const { data: dbPlayers } = await admin
      .from('player_match_stats')
      .select('*')
      .in('team_id', teamIds)
      .order('kickoff_at', { ascending: false })
      .limit(400);
    const playerRows: PlayerMatchRow[] = (dbPlayers ?? []) as PlayerMatchRow[];

    const samples: Record<'home' | 'away', Map<number, TeamMatchSample>> = { home: new Map(), away: new Map() };
    const { data: dbMatches } = await admin
      .from('matches')
      .select('fixture_id, kickoff_at, home_team, away_team, home_score, away_score, stats')
      .eq('sport_type', 'football')
      .eq('status_short', 'FT')
      .not('stats', 'is', null)
      .or(`home_team.in.("${match.home_team}","${match.away_team}"),away_team.in.("${match.home_team}","${match.away_team}")`)
      .order('kickoff_at', { ascending: false })
      .limit(20);
    for (const m of dbMatches ?? []) {
      for (const side of ['home', 'away'] as const) {
        const s = teamSampleFromRow(m, lineups[side].team);
        if (s) samples[side].set(s.fixture_id, s);
      }
    }

    let usedApi = false;
    if (PAID && (samples.home.size < 5 || samples.away.size < 5) && hasQuotaForOptional()) {
      const ids = new Set<number>();
      for (const side of ['home', 'away'] as const) {
        if (samples[side].size >= 5) continue;
        for (const id of await getTeamLastFixtureIds(lineups[side].team_id, 5, KEY)) if (!samples[side].has(id)) ids.add(id);
      }
      if (ids.size) {
        const fixtures = await getFixturesByIds([...ids], KEY); // ücretli planda 20 maç = 1 istek
        const newRows: PlayerMatchRow[] = [];
        for (const f of fixtures) {
          for (const side of ['home', 'away'] as const) {
            const s = teamSampleFromFixture(f, lineups[side].team_id);
            if (s) samples[side].set(s.fixture_id, s);
          }
          newRows.push(...mapPlayerMatchRows(f));
        }
        playerRows.push(...newRows);
        if (newRows.length) {
          // Form hafızasına yaz: sonraki önizlemeler aynı maçlar için tekrar istek atmaz
          const { error: pErr } = await admin.from('player_match_stats').upsert(newRows, { onConflict: 'fixture_id,player_id' });
          if (pErr) console.warn('[generate-preview] oyuncu istatistikleri kaydedilemedi:', pErr.message);
        }
        usedApi = true;
      }
    }

    const form = { home: computeTeamForm([...samples.home.values()]), away: computeTeamForm([...samples.away.values()]) };
    const { matchups, key_index } = computeMatchups(lineups, playerRows);
    const facts: PreviewFacts = {
      home_team: match.home_team,
      away_team: match.away_team,
      league: match.league_name,
      kickoff_at: match.kickoff_at,
      lineups,
      form,
      matchups,
      key_index,
      absences: computeAbsences(injuries, lineups, playerRows),
      data_basis:
        form.home.n === 0 && form.away.n === 0 && !playerRows.length
          ? 'lineups_only'
          : usedApi
            ? (dbMatches?.length ? 'mixed' : 'api_last5')
            : 'db_history',
    };

    // 4) Tek Gemini çağrısı
    const input = buildPreviewInput(facts);
    const { data, usage } = await generateJson<PreviewLlmOut>({
      apiKey: Deno.env.get('GEMINI_API_KEY')!,
      model: MODEL,
      system: PREVIEW_SYSTEM_INSTRUCTION,
      input,
      schema: PREVIEW_SCHEMA,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
    });
    const payload = assemblePreview(facts, input, data);

    const { error: insErr } = await admin.from('match_previews').upsert({
      fixture_id,
      preview_payload: payload,
      model: MODEL,
      input_tokens: usage.input,
      output_tokens: usage.output + usage.thought,
    });
    if (insErr) return fail(`kayıt hatası: ${insErr.message}`);

    // Kadro herkese açık bilgi: matches.lineups'a da yazılır; Realtime bekleyen istemcilere iletir
    await admin
      .from('matches')
      .update({ preview_status: 'completed', lineups: payload.lineups })
      .eq('fixture_id', fixture_id);

    console.log(`[generate-preview] ${fixture_id} ok · ${facts.data_basis} · in=${usage.input} out=${usage.output}`);
    return json({ ok: true, usage, data_basis: facts.data_basis });
  } catch (e) {
    return fail(e instanceof Error ? e.message : String(e));
  }
});
