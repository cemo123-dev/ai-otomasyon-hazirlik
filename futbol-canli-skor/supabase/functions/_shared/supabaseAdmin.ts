import { createClient } from 'npm:@supabase/supabase-js@2';

export const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
});

/** pg_net (cron / tetikleyici) çağrılarını doğrular. Fonksiyonlar --no-verify-jwt ile deploy edilir. */
export function authorized(req: Request): boolean {
  const expected = Deno.env.get('INTERNAL_SECRET');
  const got = req.headers.get('x-internal-secret');
  if (!expected || !got || got.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < got.length; i++) diff |= got.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
