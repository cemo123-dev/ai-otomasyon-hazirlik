// _shared/revenuecat.ts (webhook olayı → Pro eylemleri, Authorization doğrulama) — saf. npm run test:functions.
// Olay türleri: https://www.revenuecat.com/docs/integrations/webhooks/event-types-and-fields
import { assert, assertEquals } from 'jsr:@std/assert@1';
import { actionFromSubscriber, authHeaderOk, mapRevenueCatEvent, type RcEvent, supabaseUserId } from '../_shared/revenuecat.ts';

const UID = '0b5f7c1e-2d3a-4e5f-8a9b-0c1d2e3f4a5b';
const UID2 = '1c6a8d2f-3e4b-4f60-9bac-1d2e3f4a5b6c';
const T = Date.parse('2026-11-19T10:00:00Z');
const EXP = Date.parse('2026-11-26T10:00:00Z');
const O = { entitlement: 'pro', nowMs: T };
const ev = (type: string, o: Partial<RcEvent> = {}): RcEvent => ({
  id: `evt-${type}`,
  type,
  app_user_id: UID,
  original_app_user_id: UID,
  aliases: [UID],
  entitlement_ids: ['pro'],
  product_id: 'skor_pro_monthly:monthly',
  period_type: 'NORMAL',
  event_timestamp_ms: T,
  expiration_at_ms: EXP,
  environment: 'PRODUCTION',
  store: 'PLAY_STORE',
  ...o,
});
const iso = (ms: number) => new Date(ms).toISOString();

Deno.test('INITIAL_PURCHASE (deneme dahil) → grant, bitiş = expiration_at_ms', () => {
  const m = mapRevenueCatEvent(ev('INITIAL_PURCHASE', { period_type: 'TRIAL' }), O);
  assertEquals(m.actions, [{ kind: 'grant', userId: UID, expiresAt: iso(EXP) }]);
  assertEquals([m.eventId, m.type, m.eventAt, m.environment, m.productId, m.ignored], ['evt-INITIAL_PURCHASE', 'INITIAL_PURCHASE', iso(T), 'PRODUCTION', 'skor_pro_monthly:monthly', null]);
});

Deno.test('RENEWAL → grant yeni bitişe kadar', () => {
  const next = EXP + 30 * 86_400_000;
  assertEquals(mapRevenueCatEvent(ev('RENEWAL', { expiration_at_ms: next }), O).actions, [{ kind: 'grant', userId: UID, expiresAt: iso(next) }]);
});

Deno.test('CANCELLATION → dönem sonuna kadar Pro sürer; iade (CUSTOMER_SUPPORT) → hemen revoke', () => {
  assertEquals(mapRevenueCatEvent(ev('CANCELLATION', { cancel_reason: 'UNSUBSCRIBE' }), O).actions, [{ kind: 'grant', userId: UID, expiresAt: iso(EXP) }]);
  assertEquals(mapRevenueCatEvent(ev('CANCELLATION', { cancel_reason: 'CUSTOMER_SUPPORT' }), O).actions, [{ kind: 'revoke', userId: UID, expiresAt: iso(T) }]);
});

Deno.test('EXPIRATION → revoke (bitiş zamanı; yoksa olay zamanı)', () => {
  assertEquals(mapRevenueCatEvent(ev('EXPIRATION', { expiration_reason: 'UNSUBSCRIBE' }), O).actions, [{ kind: 'revoke', userId: UID, expiresAt: iso(EXP) }]);
  assertEquals(mapRevenueCatEvent(ev('EXPIRATION', { expiration_at_ms: null }), O).actions, [{ kind: 'revoke', userId: UID, expiresAt: iso(T) }]);
});

Deno.test('BILLING_ISSUE → ödemesiz süre (grace) sonuna kadar; grace yoksa mevcut bitiş', () => {
  const grace = T + 3 * 86_400_000;
  assertEquals(mapRevenueCatEvent(ev('BILLING_ISSUE', { grace_period_expiration_at_ms: grace }), O).actions, [{ kind: 'grant', userId: UID, expiresAt: iso(grace) }]);
  assertEquals(mapRevenueCatEvent(ev('BILLING_ISSUE', { grace_period_expiration_at_ms: null }), O).actions, [{ kind: 'grant', userId: UID, expiresAt: iso(EXP) }]);
});

Deno.test('PRODUCT_CHANGE → grant (yeni ürün kayda düşer)', () => {
  const m = mapRevenueCatEvent(ev('PRODUCT_CHANGE', { new_product_id: 'skor_pro_yearly:yearly' }), O);
  assertEquals(m.actions, [{ kind: 'grant', userId: UID, expiresAt: iso(EXP) }]);
  assertEquals(m.productId, 'skor_pro_yearly:yearly');
});

Deno.test('TRANSFER → verenden revoke, alana refresh (REST); app_user_id gerekmez', () => {
  const m = mapRevenueCatEvent(
    ev('TRANSFER', { app_user_id: null, entitlement_ids: null, transferred_from: [UID, '$RCAnonymousID:abc'], transferred_to: [UID2.toUpperCase()] }),
    O,
  );
  assertEquals(m.actions, [
    { kind: 'revoke', userId: UID, expiresAt: iso(T) },
    { kind: 'refresh', userId: UID2 },
  ]);
  assertEquals(mapRevenueCatEvent(ev('TRANSFER', { transferred_from: ['$RCAnonymousID:a'], transferred_to: ['$RCAnonymousID:b'] }), O).ignored, 'no_user');
});

Deno.test('diğer grant türleri: UNCANCELLATION, SUBSCRIPTION_EXTENDED, TEMPORARY_ENTITLEMENT_GRANT', () => {
  for (const t of ['UNCANCELLATION', 'SUBSCRIPTION_EXTENDED', 'TEMPORARY_ENTITLEMENT_GRANT', 'NON_RENEWING_PURCHASE', 'REFUND_REVERSED']) {
    assertEquals(mapRevenueCatEvent(ev(t), O).actions[0]?.kind, 'grant', t);
  }
});

Deno.test('yok sayılanlar: TEST, başka yetki, kimliksiz, bilinmeyen tür, bitişsiz grant, olay kimliği yok', () => {
  assertEquals(mapRevenueCatEvent(ev('TEST'), O).ignored, 'info');
  assertEquals(mapRevenueCatEvent(ev('INITIAL_PURCHASE', { entitlement_ids: ['other'] }), O).ignored, 'other_entitlement');
  assertEquals(
    mapRevenueCatEvent(ev('INITIAL_PURCHASE', { app_user_id: '$RCAnonymousID:x', original_app_user_id: '$RCAnonymousID:x', aliases: [] }), O).ignored,
    'no_user',
  );
  assertEquals(mapRevenueCatEvent(ev('SOMETHING_NEW'), O).ignored, 'unknown_type');
  assertEquals(mapRevenueCatEvent(ev('RENEWAL', { expiration_at_ms: null }), O).ignored, 'no_expiration');
  assertEquals(mapRevenueCatEvent(ev('RENEWAL', { id: '' }), O).ignored, 'no_event_id');
  for (const t of ['TEST', 'SOMETHING_NEW']) assertEquals(mapRevenueCatEvent(ev(t), O).actions, []);
});

Deno.test('yetki listesi yoksa (eski olay) yok sayılmaz; tekil entitlement_id de okunur', () => {
  assertEquals(mapRevenueCatEvent(ev('RENEWAL', { entitlement_ids: null }), O).actions.length, 1);
  assertEquals(mapRevenueCatEvent(ev('RENEWAL', { entitlement_ids: null, entitlement_id: 'other' }), O).ignored, 'other_entitlement');
});

Deno.test('supabaseUserId: anonim RC kimliği atlanır, alias / original içinden UUID, küçük harf', () => {
  assertEquals(supabaseUserId({ app_user_id: '$RCAnonymousID:1', original_app_user_id: null, aliases: ['$RCAnonymousID:1', UID.toUpperCase()] }), UID);
  assertEquals(supabaseUserId({ app_user_id: '$RCAnonymousID:1', original_app_user_id: UID2 }), UID2);
  assertEquals(supabaseUserId({ app_user_id: 'not-a-uuid' }), null);
});

Deno.test('olay zamanı yoksa nowMs; tür büyük harfe çevrilir', () => {
  const m = mapRevenueCatEvent(ev('renewal', { event_timestamp_ms: null }), { entitlement: 'pro', nowMs: T + 5 });
  assertEquals([m.type, m.eventAt], ['RENEWAL', iso(T + 5)]);
});

Deno.test('authHeaderOk: birebir ya da Bearer; yanlış / boş / kısa secret reddedilir', () => {
  const S = 'a'.repeat(24) + 'Z9';
  assert(authHeaderOk(S, S));
  assert(authHeaderOk(`Bearer ${S}`, S));
  assertEquals(authHeaderOk(S + 'x', S), false);
  assertEquals(authHeaderOk(S.slice(0, -1), S), false);
  assertEquals(authHeaderOk(null, S), false);
  assertEquals(authHeaderOk('', S), false);
  assertEquals(authHeaderOk('short', 'short'), false); // secret < 16 karakter: yapılandırma hatası, kapalı
  assertEquals(authHeaderOk(S, undefined), false);
  assertEquals(authHeaderOk('x'.repeat(600), 'x'.repeat(600)), false);
});

Deno.test('actionFromSubscriber: TRANSFER alıcısı REST yanıtı', () => {
  const future = '2026-12-19T10:00:00Z';
  assertEquals(actionFromSubscriber(UID, { subscriber: { entitlements: { pro: { expires_date: future } } } }, 'pro', T), {
    kind: 'grant',
    userId: UID,
    expiresAt: new Date(future).toISOString(),
  });
  assertEquals(actionFromSubscriber(UID, { subscriber: { entitlements: { pro: { expires_date: '2026-11-01T00:00:00Z' } } } }, 'pro', T).kind, 'revoke');
  assertEquals(actionFromSubscriber(UID, { subscriber: { entitlements: {} } }, 'pro', T).kind, 'revoke');
  assertEquals(actionFromSubscriber(UID, { subscriber: { entitlements: { pro: { expires_date: null } } } }, 'pro', T).kind, 'revoke');
  assertEquals(actionFromSubscriber(UID, null, 'pro', T).kind, 'revoke');
});
