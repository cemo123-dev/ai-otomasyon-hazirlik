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
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'x-goog-api-key': opts.apiKey,
      'Content-Type': 'application/json',
      'Api-Revision': API_REVISION,
    },
    body: JSON.stringify({
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
    }),
  });

  if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 500)}`);
  const body: Json = await res.json();

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
