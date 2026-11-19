// RevenueCat webhook → profiles.is_premium / subscription_expires_at (P2, GELISTIRMELER 3.38; migration 0021).
// Deploy: --no-verify-jwt (RevenueCat Supabase JWT taşımaz). Kimlik doğrulama: Authorization başlığı
// REVENUECAT_WEBHOOK_AUTH secret'ı ile birebir (ya da "Bearer <secret>"). Idempotent: olay kimliği başına tek
// işlem (`apply_billing_event` RPC'si tek SQL işleminde kaydeder + günceller; tekrar → 'duplicate', 200).
// Hata → 500: RevenueCat olayı geri çekilerek yeniden dener; olay kaybolmaz.
// Secret'lar: REVENUECAT_WEBHOOK_AUTH (zorunlu), REVENUECAT_ENTITLEMENT (varsayılan "pro"),
// REVENUECAT_REST_KEY (isteğe bağlı, gizli v1 anahtarı: TRANSFER alıcısının güncel durumunu okumak için).
import { actionFromSubscriber, authHeaderOk, mapRevenueCatEvent, type BillingAction, type RcEvent } from '../_shared/revenuecat.ts';
import { admin, json } from '../_shared/supabaseAdmin.ts';

const ENTITLEMENT = Deno.env.get('REVENUECAT_ENTITLEMENT')?.trim() || 'pro';
const MAX_BODY = 64 * 1024;

async function resolveRefresh(a: BillingAction): Promise<BillingAction | null> {
  if (a.kind !== 'refresh') return a;
  const key = Deno.env.get('REVENUECAT_REST_KEY');
  if (!key) {
    console.warn(`[revenuecat-webhook] TRANSFER alıcısı ${a.userId.slice(0, 8)}: REVENUECAT_REST_KEY yok, sonraki olayla güncellenecek`);
    return null;
  }
  const res = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(a.userId)}`, {
    headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`revenuecat rest ${res.status}`);
  return actionFromSubscriber(a.userId, await res.json(), ENTITLEMENT, Date.now());
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  if (!authHeaderOk(req.headers.get('authorization'), Deno.env.get('REVENUECAT_WEBHOOK_AUTH'))) {
    return json({ error: 'unauthorized' }, 401);
  }
  const text = await req.text().catch(() => '');
  if (!text || text.length > MAX_BODY) return json({ error: 'body' }, 400);
  let event: RcEvent | null = null;
  try {
    event = (JSON.parse(text) as { event?: RcEvent }).event ?? null;
  } catch {
    event = null;
  }
  if (!event || typeof event !== 'object') return json({ error: 'event' }, 400);

  const m = mapRevenueCatEvent(event, { entitlement: ENTITLEMENT, nowMs: Date.now() });
  if (!m.eventId) return json({ error: 'event_id' }, 400);

  try {
    const resolved = (await Promise.all(m.actions.map(resolveRefresh))).filter((a): a is BillingAction => a != null);
    const actions = resolved.map((a) => ({ kind: a.kind, user_id: a.userId, expires_at: a.kind === 'refresh' ? null : a.expiresAt }));
    const { data, error } = await admin.rpc('apply_billing_event', {
      p_event_id: m.eventId,
      p_type: m.type || 'UNKNOWN',
      p_event_at: m.eventAt,
      p_environment: m.environment,
      p_product_id: m.productId,
      p_actions: actions,
      p_ignored: m.ignored,
    });
    if (error) throw new Error(error.message);
    if (data === 'invalid') {
      console.error(`[revenuecat-webhook] ${m.type} ${m.eventId}: geçersiz eylem`);
      return json({ ok: false, result: 'invalid' }, 400);
    }
    console.log(`[revenuecat-webhook] ${m.type} ${m.environment ?? '-'} ${m.eventId} → ${data}${m.ignored ? ` (yok sayıldı: ${m.ignored})` : ''} · eylem=${actions.length}`);
    return json({ ok: true, result: data });
  } catch (e) {
    console.error(`[revenuecat-webhook] ${m.type} ${m.eventId}:`, (e as Error).message);
    return json({ ok: false }, 500);
  }
});
