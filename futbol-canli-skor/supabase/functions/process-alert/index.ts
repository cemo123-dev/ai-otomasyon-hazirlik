// Tetikleyici: match_alerts INSERT → pg_net → bu fonksiyon (bkz. 0007_alerts.sql)
// Kırmızı kartta önce Gemini ile kısa canlı taktik analiz (Pro), ardından takipçilere push.
// Baskı ve NBA serisi alarmlarında LLM yok: metin koddan gelir (0 token).
import {
  assembleRedCard,
  buildRedCardInput,
  RED_CARD_ANALYSIS_SUFFIX,
  RED_CARD_SCHEMA,
  RED_CARD_SYSTEM_INSTRUCTION,
  type AlertKind,
  type RedCardLlmOut,
} from '../_shared/alerts.ts';
import { generateJson } from '../_shared/gemini.ts';
import { notifyFollowers } from '../_shared/notify.ts';
import { admin, authorized, json } from '../_shared/supabaseAdmin.ts';
import type { MatchEvent, MatchStats } from '../_shared/types.ts';

const MODEL = Deno.env.get('GEMINI_MODEL') ?? 'gemini-3.5-flash-lite';
const MAX_OUTPUT_TOKENS = Number(Deno.env.get('RED_CARD_MAX_OUTPUT_TOKENS') ?? 400);

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  if (!(await authorized(req))) return json({ error: 'unauthorized' }, 401);
  const { alert_id } = await req.json().catch(() => ({}));
  if (!Number.isInteger(alert_id)) return json({ error: 'alert_id' }, 400);

  const { data: alert } = await admin.from('match_alerts').select('*').eq('id', alert_id).maybeSingle();
  if (!alert) return json({ ok: false, reason: 'alarm yok' }, 200);

  let body: string = alert.body;
  if ((alert.kind as AlertKind) === 'red_card') {
    const ok = await analyseRedCard(alert);
    if (ok) body += RED_CARD_ANALYSIS_SUFFIX;
  }

  const pushed = await notifyFollowers(alert.fixture_id, alert.kind, alert.title, body, { alert_id });
  console.log(`[process-alert] ${alert_id} ${alert.kind} · push=${pushed}`);
  return json({ ok: true, pushed });
});

/** Kırmızı kart sonrası canlı taktik analiz. Başarısızsa push yine gider (analiz cümlesi olmadan). */
async function analyseRedCard(alert: Record<string, unknown>): Promise<boolean> {
  const setStatus = (analysis_status: string) => admin.from('match_alerts').update({ analysis_status }).eq('id', alert.id);
  try {
    await setStatus('generating');
    const { data: m } = await admin
      .from('matches')
      .select('home_team, away_team, home_score, away_score, elapsed_minute, stats, events')
      .eq('fixture_id', alert.fixture_id)
      .maybeSingle();
    if (!m) throw new Error('maç yok');
    const events = (m.events as MatchEvent[] | null) ?? [];
    const red = events.find((e) => e.type === 'red_card' && e.minute === alert.minute && e.team === alert.side);
    const facts = {
      home_team: m.home_team as string,
      away_team: m.away_team as string,
      minute: (m.elapsed_minute as number | null) ?? (alert.minute as number),
      score: { home: (m.home_score as number | null) ?? 0, away: (m.away_score as number | null) ?? 0 },
      red: { side: alert.side as 'home' | 'away', player: red?.player ?? '—', minute: alert.minute as number },
      stats: m.stats as MatchStats | null,
      events,
    };
    const input = buildRedCardInput(facts);
    const { data, usage } = await generateJson<RedCardLlmOut>({
      apiKey: Deno.env.get('GEMINI_API_KEY')!,
      model: MODEL,
      system: RED_CARD_SYSTEM_INSTRUCTION,
      input,
      schema: RED_CARD_SCHEMA,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
    });
    const payload = assembleRedCard(facts, input, data);
    const { error } = await admin.from('match_alert_analyses').upsert({
      alert_id: alert.id,
      fixture_id: alert.fixture_id,
      payload,
      model: MODEL,
      input_tokens: usage.input,
      output_tokens: usage.output + usage.thought,
    });
    if (error) throw error;
    await setStatus('completed');
    return true;
  } catch (e) {
    console.error(`[process-alert] ${alert.id} analiz hatası:`, e instanceof Error ? e.message : e);
    await setStatus('failed');
    return false;
  }
}
