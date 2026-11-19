/**
 * RevenueCat webhook olayı → profil Pro durumu eylemleri — SAF (Deno test eder: tests/revenuecat.test.ts).
 * Belge: https://www.revenuecat.com/docs/integrations/webhooks/event-types-and-fields
 *
 * Sunucu tek doğruluk kaynağı: `profiles.is_premium` + `subscription_expires_at` (0001 `is_premium_user()`
 * süreyi de denetler). Eylem türleri:
 *  - grant:   is_premium = true,  expires_at = olayın bitiş zamanı (deneme / dönem / ödemesiz süre sonu)
 *  - revoke:  is_premium = false, expires_at = olay zamanı (ya da bitiş)
 *  - refresh: durum bilinmiyor (TRANSFER'in alıcı tarafı) → RevenueCat REST'ten okunur (index.ts)
 */

export type RcEvent = {
  id?: string;
  type?: string;
  app_user_id?: string | null;
  original_app_user_id?: string | null;
  aliases?: string[] | null;
  entitlement_ids?: string[] | null;
  entitlement_id?: string | null;
  product_id?: string | null;
  new_product_id?: string | null;
  period_type?: string | null;
  event_timestamp_ms?: number | null;
  expiration_at_ms?: number | null;
  grace_period_expiration_at_ms?: number | null;
  cancel_reason?: string | null;
  expiration_reason?: string | null;
  environment?: string | null;
  store?: string | null;
  transferred_from?: string[] | null;
  transferred_to?: string[] | null;
};

export type BillingAction =
  | { kind: 'grant'; userId: string; expiresAt: string }
  | { kind: 'revoke'; userId: string; expiresAt: string }
  | { kind: 'refresh'; userId: string };

export type Mapped = {
  /** Olay kaydı (idempotency) her durumda yazılır; `ignored` sebebi kayda düşer */
  eventId: string;
  type: string;
  eventAt: string;
  environment: string | null;
  productId: string | null;
  actions: BillingAction[];
  ignored: string | null;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (s: unknown): s is string => typeof s === 'string' && UUID_RE.test(s);

/** Supabase kullanıcı kimliği: app_user_id → original_app_user_id → aliases içinden ilk UUID ($RCAnonymousID atlanır) */
export function supabaseUserId(e: RcEvent): string | null {
  const cands = [e.app_user_id, e.original_app_user_id, ...(e.aliases ?? [])];
  for (const c of cands) if (isUuid(c)) return c.toLowerCase();
  return null;
}

const iso = (ms: number | null | undefined): string | null =>
  typeof ms === 'number' && Number.isFinite(ms) && ms > 0 ? new Date(ms).toISOString() : null;

/** Pro'yu açan / sürdüren olaylar (bitiş zamanına kadar) */
const GRANT_TYPES = new Set([
  'INITIAL_PURCHASE',
  'RENEWAL',
  'UNCANCELLATION',
  'PRODUCT_CHANGE',
  'NON_RENEWING_PURCHASE',
  'SUBSCRIPTION_EXTENDED',
  'TEMPORARY_ENTITLEMENT_GRANT',
  'REFUND_REVERSED',
]);
/** Kayda düşen ama durum değiştirmeyen olaylar */
const INFO_TYPES = new Set(['TEST', 'SUBSCRIPTION_PAUSED', 'SUBSCRIBER_ALIAS', 'INVOICE_ISSUANCE', 'VIRTUAL_CURRENCY_TRANSACTION', 'EXPERIMENT_ENROLLMENT']);

/**
 * Olay → eylemler. `entitlement` (varsayılan `pro`): olay yetki listesi taşıyorsa ve bu yetki yoksa yok sayılır
 * (başka ürün). `nowMs` yalnız olay zamanı eksikse kullanılır.
 */
export function mapRevenueCatEvent(e: RcEvent, opts: { entitlement: string; nowMs: number }): Mapped {
  const type = String(e.type ?? '').toUpperCase();
  const eventAtMs = typeof e.event_timestamp_ms === 'number' && e.event_timestamp_ms > 0 ? e.event_timestamp_ms : opts.nowMs;
  const base: Mapped = {
    eventId: String(e.id ?? ''),
    type,
    eventAt: new Date(eventAtMs).toISOString(),
    environment: e.environment ?? null,
    productId: e.new_product_id ?? e.product_id ?? null,
    actions: [],
    ignored: null,
  };
  const ignore = (why: string): Mapped => ({ ...base, ignored: why });

  if (!base.eventId) return ignore('no_event_id');
  if (INFO_TYPES.has(type)) return ignore('info');

  if (type === 'TRANSFER') {
    // Satın alma başka kullanıcıya geçti: verenden Pro alınır; alanın güncel durumu REST'ten okunur
    const from = (e.transferred_from ?? []).filter(isUuid).map((s) => s.toLowerCase());
    const to = (e.transferred_to ?? []).filter(isUuid).map((s) => s.toLowerCase());
    const actions: BillingAction[] = [
      ...from.filter((u) => !to.includes(u)).map((userId): BillingAction => ({ kind: 'revoke', userId, expiresAt: base.eventAt })),
      ...to.map((userId): BillingAction => ({ kind: 'refresh', userId })),
    ];
    return actions.length ? { ...base, actions } : ignore('no_user');
  }

  const ents = e.entitlement_ids ?? (e.entitlement_id ? [e.entitlement_id] : null);
  if (ents && ents.length && !ents.includes(opts.entitlement)) return ignore('other_entitlement');

  const userId = supabaseUserId(e);
  if (!userId) return ignore('no_user');
  const expiresAt = iso(e.expiration_at_ms);
  // Süresiz Pro hiçbir olaydan doğmaz (ömür boyu ürün yok): bitişi olmayan "açan" olay yok sayılır
  const grant = (until: string | null): Mapped =>
    until ? { ...base, actions: [{ kind: 'grant', userId, expiresAt: until }] } : ignore('no_expiration');

  if (GRANT_TYPES.has(type)) return grant(expiresAt);

  if (type === 'CANCELLATION') {
    // Otomatik yenileme kapandı: dönem sonuna kadar Pro sürer. İade (CUSTOMER_SUPPORT) → hemen kapanır.
    if (e.cancel_reason === 'CUSTOMER_SUPPORT') return { ...base, actions: [{ kind: 'revoke', userId, expiresAt: base.eventAt }] };
    return grant(expiresAt);
  }

  if (type === 'BILLING_ISSUE') {
    // Ödeme sorunu: Play ödemesiz süre (grace) verdiyse o süre sonuna kadar Pro; yoksa mevcut bitiş
    return grant(iso(e.grace_period_expiration_at_ms) ?? expiresAt);
  }

  if (type === 'EXPIRATION') {
    return { ...base, actions: [{ kind: 'revoke', userId, expiresAt: expiresAt ?? base.eventAt }] };
  }

  return ignore('unknown_type');
}

/** Authorization başlığı: panelde girilen değer birebir ya da `Bearer <değer>`. Sabit zamanlı karşılaştırma. */
export function authHeaderOk(header: string | null, secret: string | undefined | null): boolean {
  if (!secret || secret.length < 16 || !header || header.length > 512) return false;
  const got = header.startsWith('Bearer ') ? header.slice(7) : header;
  const a = new TextEncoder().encode(got);
  const b = new TextEncoder().encode(secret);
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return diff === 0;
}

/** RevenueCat REST v1 abone yanıtı → yetki bitişi (TRANSFER alıcısı için). Yetki yoksa / süresi geçtiyse revoke. */
export function actionFromSubscriber(
  userId: string,
  body: { subscriber?: { entitlements?: Record<string, { expires_date?: string | null } | undefined> } } | null,
  entitlement: string,
  nowMs: number,
): BillingAction {
  const ent = body?.subscriber?.entitlements?.[entitlement];
  if (!ent) return { kind: 'revoke', userId, expiresAt: new Date(nowMs).toISOString() };
  // Süresiz yetki (ömür boyu ürün yok) Pro açmaz: bitişsiz değer revoke sayılır
  const exp = ent.expires_date ? Date.parse(ent.expires_date) : NaN;
  if (!Number.isFinite(exp) || exp <= nowMs) return { kind: 'revoke', userId, expiresAt: new Date(nowMs).toISOString() };
  return { kind: 'grant', userId, expiresAt: new Date(exp).toISOString() };
}
