// Tetikleyici: match_chat INSERT → pg_net → bu fonksiyon (bkz. 0008_assistant.sql)
// "Taktik Asistana Sor": tek Gemini çağrısı, girdi = maçın hazır dosyası + soru.
// Yanıttaki sayılar dosyayla doğrulanır: doğrulanamayan sayı içeren cümleler atılır,
// geriye anlamlı yanıt kalmazsa soru hakkı iade edilir (status=failed).
import {
  ASSISTANT_SCHEMA,
  ASSISTANT_SYSTEM_INSTRUCTION,
  buildAssistantInput,
  buildDossier,
  isCurrentDossier,
  sanitizeAnswer,
} from '../_shared/dossier.ts';
import { generateJson } from '../_shared/gemini.ts';
import { admin, authorized, json } from '../_shared/supabaseAdmin.ts';

const MODEL = Deno.env.get('ASSISTANT_MODEL') ?? Deno.env.get('GEMINI_MODEL') ?? 'gemini-3.5-flash-lite';
const MAX_OUTPUT_TOKENS = Number(Deno.env.get('ASSISTANT_MAX_OUTPUT_TOKENS') ?? 300);
const FINISHED = ['FT', 'AET', 'PEN'];

const REFUND_MSG = 'Bu soruya maç verisiyle doğrulanmış bir yanıt veremedim; soru hakkın iade edildi. Soruyu farklı sorabilirsin.';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  if (!(await authorized(req))) return json({ error: 'unauthorized' }, 401);
  const { message_id } = await req.json().catch(() => ({}));
  if (!Number.isInteger(message_id)) return json({ error: 'message_id' }, 400);

  const { data: msg } = await admin.from('match_chat').select('id, fixture_id, question, status').eq('id', message_id).maybeSingle();
  if (!msg || msg.status !== 'pending') return json({ ok: false, reason: 'yok veya yanıtlanmış' }, 200);

  const finish = (patch: Record<string, unknown>) => admin.from('match_chat').update(patch).eq('id', message_id);

  try {
    const dossier = await getDossier(msg.fixture_id);
    if (!dossier) {
      await finish({ status: 'failed', answer: REFUND_MSG });
      return json({ ok: false, reason: 'dosya yok' });
    }
    const input = buildAssistantInput(dossier, msg.question);
    const { data, usage } = await generateJson<{ a: string }>({
      apiKey: Deno.env.get('GEMINI_API_KEY')!,
      model: MODEL,
      system: ASSISTANT_SYSTEM_INSTRUCTION,
      input,
      schema: ASSISTANT_SCHEMA,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
    });
    const raw = data.a?.trim() ?? '';
    const answer = raw ? sanitizeAnswer(raw, dossier, msg.question) : null;
    const ok = !!answer;
    if (answer !== raw) console.warn(`[ask-assistant] ${message_id} doğrulanamayan kısım atıldı:`, raw);
    await finish({
      status: ok ? 'answered' : 'failed',
      answer: ok ? answer : REFUND_MSG,
      model: MODEL,
      input_tokens: usage.input,
      output_tokens: usage.output + usage.thought,
    });
    console.log(`[ask-assistant] ${message_id} ${ok ? 'ok' : 'iade'} · in=${usage.input} out=${usage.output}`);
    return json({ ok });
  } catch (e) {
    console.error(`[ask-assistant] ${message_id}:`, e instanceof Error ? e.message : e);
    await finish({ status: 'failed', answer: REFUND_MSG });
    return json({ ok: false });
  }
});

/** Biten maçta önbellekten; yoksa veritabanından derle (bitmişse sakla) */
async function getDossier(fixtureId: number): Promise<string | null> {
  const { data: cached } = await admin.from('match_dossiers').select('dossier').eq('fixture_id', fixtureId).maybeSingle();
  // Eski sürüm dosya (çıkarımsız) yeniden derlenir
  if (cached?.dossier && isCurrentDossier(cached.dossier as string)) return cached.dossier as string;

  const { data: m } = await admin
    .from('matches')
    .select('fixture_id, sport_type, league_name, home_team, away_team, home_score, away_score, status_short, period_scores, home_coach, away_coach, stats, events, top_players')
    .eq('fixture_id', fixtureId)
    .maybeSingle();
  if (!m) return null;
  const [{ data: an }, { data: ht }, { data: al }] = await Promise.all([
    admin.from('match_analyses').select('tactical_payload').eq('fixture_id', fixtureId).maybeSingle(),
    admin.from('match_halftime_reports').select('report_payload').eq('fixture_id', fixtureId).maybeSingle(),
    admin.from('match_alerts').select('minute, title, body').eq('fixture_id', fixtureId).order('created_at'),
  ]);
  const dossier = buildDossier({
    match: m,
    analysis: an?.tactical_payload ?? null,
    halftime: ht?.report_payload ?? null,
    alerts: (al ?? []) as { minute: number | null; title: string; body: string }[],
  });
  if (FINISHED.includes(m.status_short)) {
    await admin.from('match_dossiers').upsert({ fixture_id: fixtureId, dossier, built_at: new Date().toISOString() });
  }
  return dossier;
}
