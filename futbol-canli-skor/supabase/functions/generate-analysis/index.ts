// Tetikleyici: analysis_jobs INSERT → pg_net → bu fonksiyon (bkz. 0002_pipeline.sql, 0003_nba.sql)
// Maç başına tek Gemini çağrısı; sonuç tüm Pro abonelerle paylaşılır.
// sport_type'a göre futbol veya NBA analiz modülü kullanılır.
import { assemblePayload, buildCompactInput, LLM_SCHEMA, SYSTEM_INSTRUCTION, type LlmOut } from '../_shared/analysis.ts';
import { generateJson } from '../_shared/gemini.ts';
import {
  assembleNbaPayload,
  buildNbaCompactInput,
  NBA_LLM_SCHEMA,
  NBA_SYSTEM_INSTRUCTION,
  type NbaLlmOut,
  type NbaMatchRow,
} from '../_shared/nbaAnalysis.ts';
import { admin, authorized, json } from '../_shared/supabaseAdmin.ts';
import { FINISHED, type MatchRow } from '../_shared/types.ts';

const MODEL = Deno.env.get('GEMINI_MODEL') ?? 'gemini-3.5-flash-lite';
const MAX_OUTPUT_TOKENS = Number(Deno.env.get('GEMINI_MAX_OUTPUT_TOKENS') ?? 900);

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  if (!(await authorized(req))) return json({ error: 'unauthorized' }, 401);

  const { fixture_id } = await req.json().catch(() => ({}));
  if (!Number.isInteger(fixture_id)) return json({ error: 'fixture_id' }, 400);

  const fail = async (reason: string) => {
    console.error(`[generate-analysis] ${fixture_id}: ${reason}`);
    await admin.from('matches').update({ analysis_status: 'failed' }).eq('fixture_id', fixture_id);
    return json({ ok: false, reason }, 200); // 200: pg_net yeniden denemesin, RPC'nin retry mantığı devrede
  };

  // Veri henüz yok (senkron istatistiği yazmadı): 'failed' yerine 'none' + deneme iadesi.
  // Böylece analiz kalıcı kilitlenmez; RPC (0015) veri gelene kadar zaten 'not_ready' döner.
  const notReady = async (reason: string, attempts: number | null | undefined) => {
    console.warn(`[generate-analysis] ${fixture_id}: ${reason} (deneme iade edildi)`);
    await admin
      .from('matches')
      .update({ analysis_status: 'none', analysis_attempts: Math.max(0, (attempts ?? 1) - 1) })
      .eq('fixture_id', fixture_id);
    return json({ ok: false, reason, not_ready: true }, 200);
  };

  try {
    // İdempotent: aynı iş iki kez gelirse ikinci LLM çağrısı yapılmaz
    const { data: existing } = await admin.from('match_analyses').select('fixture_id').eq('fixture_id', fixture_id).maybeSingle();
    if (existing) {
      await admin.from('matches').update({ analysis_status: 'completed' }).eq('fixture_id', fixture_id);
      return json({ ok: true, cached: true });
    }

    const { data: match, error } = await admin.from('matches').select('*').eq('fixture_id', fixture_id).maybeSingle<MatchRow>();
    if (error || !match) return fail('maç bulunamadı');
    if (!FINISHED.includes(match.status_short)) return fail('maç bitmemiş');
    const attempts = (match as { analysis_attempts?: number }).analysis_attempts;
    if (!match.stats) return notReady('istatistik yok', attempts);

    const isNba = match.sport_type === 'nba';
    let payload: unknown;
    let usage;
    if (isNba) {
      const nba = match as unknown as NbaMatchRow;
      if (!nba.stats?.metrics) return notReady('NBA ön-hesaplama metrikleri yok', attempts);
      const res = await generateJson<NbaLlmOut>({
        apiKey: Deno.env.get('GEMINI_API_KEY')!,
        model: MODEL,
        system: NBA_SYSTEM_INSTRUCTION,
        input: buildNbaCompactInput(nba),
        schema: NBA_LLM_SCHEMA,
        maxOutputTokens: MAX_OUTPUT_TOKENS,
      });
      payload = assembleNbaPayload(nba, res.data);
      usage = res.usage;
    } else {
      const res = await generateJson<LlmOut>({
        apiKey: Deno.env.get('GEMINI_API_KEY')!,
        model: MODEL,
        system: SYSTEM_INSTRUCTION,
        input: buildCompactInput(match),
        schema: LLM_SCHEMA,
        maxOutputTokens: MAX_OUTPUT_TOKENS,
      });
      payload = assemblePayload(match, res.data);
      usage = res.usage;
    }

    const { error: insErr } = await admin.from('match_analyses').upsert({
      fixture_id,
      tactical_payload: payload,
      model: MODEL,
      input_tokens: usage.input,
      output_tokens: usage.output + usage.thought,
    });
    if (insErr) return fail(`kayıt hatası: ${insErr.message}`);

    // Realtime bu UPDATE'i bekleyen istemcilere iletir
    await admin.from('matches').update({ analysis_status: 'completed' }).eq('fixture_id', fixture_id);

    console.log(`[generate-analysis] ${match.sport_type ?? 'football'} ${fixture_id} ok · in=${usage.input} out=${usage.output} think=${usage.thought}`);
    return json({ ok: true, usage });
  } catch (e) {
    return fail(e instanceof Error ? e.message : String(e));
  }
});
