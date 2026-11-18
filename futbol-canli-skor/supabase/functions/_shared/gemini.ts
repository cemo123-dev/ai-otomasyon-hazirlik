// Gemini Interactions API (REST). Doküman: https://aistudio.google.com/docs/structured-output
const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/interactions';
const API_REVISION = '2026-05-20';

export type GeminiUsage = { input: number; output: number; thought: number };

// deno-lint-ignore no-explicit-any
type Json = any;

export async function generateJson<T>(opts: {
  apiKey: string;
  model: string;
  system: string;
  input: string;
  schema: object;
  maxOutputTokens: number;
}): Promise<{ data: T; usage: GeminiUsage }> {
  const body = JSON.stringify({
    model: opts.model,
    system_instruction: opts.system,
    input: opts.input,
    store: false, // sunucu tarafında konuşma durumu saklanmasın
    response_format: { type: 'text', mime_type: 'application/json', schema: opts.schema },
    generation_config: {
      thinking_level: 'minimal', // düşünme tokenları da output olarak ücretlendirilir
      thinking_summaries: 'none',
      max_output_tokens: opts.maxOutputTokens,
    },
  });

  // Geçici hatalar (aşırı yük 503, kota 429, 500) beklemeli yeniden denenir
  let res: Response | null = null;
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    // Askıda kalan istek edge function'ı duvar saatine kadar bekletmesin (catch çalışsın, satır 'failed' olsun)
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'x-goog-api-key': opts.apiKey, 'Content-Type': 'application/json', 'Api-Revision': API_REVISION },
      body,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (res.ok || !RETRYABLE.has(res.status) || attempt === RETRY_DELAYS_MS.length) break;
    await res.body?.cancel();
    await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt] + Math.random() * 400));
  }

  if (!res!.ok) throw new Error(`Gemini ${res!.status}: ${(await res!.text()).slice(0, 500)}`);
  return parseResponse<T>(await res!.json());
}

const RETRYABLE = new Set([429, 500, 503]);
const RETRY_DELAYS_MS = [1000, 3000];
/** Deneme başına zaman aşımı. En kötü durum ~3×25 sn + bekleme: Edge Function sınırının (150 sn) altında. */
const REQUEST_TIMEOUT_MS = Number(Deno.env.get('GEMINI_TIMEOUT_MS') ?? 25_000);

function parseResponse<T>(body: Json): { data: T; usage: GeminiUsage } {
  const text: string | undefined =
    body.output_text ??
    [...(body.steps ?? [])]
      .reverse()
      .find((s: Json) => s.type === 'model_output')
      ?.content?.find((c: Json) => c.type === 'text')?.text;
  if (!text) throw new Error(`Gemini boş yanıt (status: ${body.status})`);

  return {
    data: JSON.parse(text) as T,
    usage: {
      input: body.usage?.total_input_tokens ?? 0,
      output: body.usage?.total_output_tokens ?? 0,
      thought: body.usage?.total_thought_tokens ?? 0,
    },
  };
}
