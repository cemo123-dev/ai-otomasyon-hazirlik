import { createClient } from 'npm:@supabase/supabase-js@2';

export const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
});

/**
 * pg_net (cron / tetikleyici) çağrılarını doğrular. Fonksiyonlar verify_jwt=false ile deploy edilir.
 * Anahtar Vault'ta rastgele üretilir (0002_pipeline.sql); karşılaştırma veritabanında yapılır,
 * böylece aynı değeri ayrıca Edge Function secret'ı olarak girmek gerekmez.
 */
export async function authorized(req: Request): Promise<boolean> {
  const got = req.headers.get('x-internal-secret');
  if (!got || got.length > 200) return false;
  const { data, error } = await admin.rpc('check_internal_secret', { p_secret: got });
  if (error) {
    console.error('[auth] check_internal_secret:', error.message);
    return false;
  }
  return data === true;
}

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
