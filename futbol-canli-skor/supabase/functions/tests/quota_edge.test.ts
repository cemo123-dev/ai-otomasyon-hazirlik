// Döngü 5: _shared/quota.ts uç durumları (eşik tam rezervde, TTL sınırı, geçersiz değer, gün dönümü).
import { assert, assertEquals } from 'jsr:@std/assert@1';
import { createQuotaGuard, QUOTA_TTL_MS, remainingFromHeader } from '../_shared/quota.ts';

const T = Date.UTC(2026, 10, 18, 12, 0, 0);

Deno.test('quota uç: kalan tam rezerv kadarsa isteğe bağlı istek reddedilir, rezerv+1 ise son istek izinli', () => {
  const q = createQuotaGuard({ paid: false });
  q.set(6, T);
  assertEquals(q.allows(6, 1, T), false);
  q.set(7, T);
  assert(q.allows(6, 1, T)); // istekten sonra tam 6 kalır
  assertEquals(q.allows(6, 2, T), false);
});

Deno.test('quota uç: needed=0 yalnız eşiği sorar; rezerv 0 iken kota 0 olunca durur', () => {
  const q = createQuotaGuard({ paid: false });
  q.set(6, T);
  assert(q.allows(6, 0, T));
  q.set(1, T);
  assert(q.allows(0, 1, T));
  q.set(0, T);
  assertEquals(q.allows(0, 1, T), false);
});

Deno.test('quota uç: TTL sınırında (tam QUOTA_TTL_MS) henüz bayat değil', () => {
  const q = createQuotaGuard({ paid: false });
  q.set(50, T);
  assertEquals(q.stale(T + QUOTA_TTL_MS), false);
  assert(q.stale(T + QUOTA_TTL_MS + 1));
});

Deno.test('quota uç: NaN / Infinity önceki geçerli değeri bozmaz', () => {
  const q = createQuotaGuard({ paid: false });
  q.set(40, T);
  q.set(Number.NaN, T + 1);
  q.set(Number.POSITIVE_INFINITY, T + 2);
  assertEquals(q.remaining(T + 3), 40);
});

Deno.test('quota uç: 23:59:59.999 → 00:00:00.000 tam sınırda değer geçersizleşir', () => {
  const q = createQuotaGuard({ paid: false });
  const last = Date.UTC(2026, 10, 18, 23, 59, 59, 999);
  q.set(2, last);
  assertEquals(q.remaining(last), 2);
  assertEquals(q.remaining(last + 1), null);
  assert(q.allows(6, 1, last + 1));
});

Deno.test('quota uç (bulgu, Döngü 5): gece yarısını geçen geç yanıt dünün kalanını bugüne yazar', () => {
  // İstek 23:59:58'de gider, yanıt 00:00:02'de gelir: başlıktaki kalan (dünün sayacı, ör. 2) set() ile
  // "bugün" damgalanır. Yeni gün kotası 100 olduğu hâlde bekçi bir sonraki başlık/status'a kadar reddeder.
  const q = createQuotaGuard({ paid: false });
  const after = Date.UTC(2026, 10, 19, 0, 0, 2);
  q.set(2, after);
  assertEquals(q.allows(6, 1, after), false); // mevcut davranış (belgelendi)
  assertEquals(q.stale(after + 60_000), false); // /status 10 dk sorulmaz
});

Deno.test('quota uç (Döngü 5 bulgu 2 düzeltmesi): değer gönderim anıyla damgalanınca dünün kalanı yeni günü kilitlemez', () => {
  // apiGet/nbaGet: sentAt = Date.now() fetch'ten önce; quota.set(rem, sentAt)
  const q = createQuotaGuard({ paid: false });
  const sentAt = Date.UTC(2026, 10, 18, 23, 59, 58);
  const after = Date.UTC(2026, 10, 19, 0, 0, 2);
  q.set(2, sentAt);
  assertEquals(q.remaining(after), null); // dünün değeri: bilinmiyor
  assertEquals(q.allows(6, 1, after), true);
  assertEquals(q.stale(after), true); // /status yeniden sorulur
});

Deno.test('quota uç (Döngü 5 bulgu 2): boş / geçersiz başlık yok sayılır', () => {
  assertEquals(remainingFromHeader(null), null);
  assertEquals(remainingFromHeader(undefined), null);
  assertEquals(remainingFromHeader(''), null); // Number('') = 0 olurdu → tüm isteğe bağlı çekimler dururdu
  assertEquals(remainingFromHeader('   '), null);
  assertEquals(remainingFromHeader('abc'), null);
  assertEquals(remainingFromHeader(' 42 '), 42);
  assertEquals(remainingFromHeader('0'), 0);
});

Deno.test('quota uç (Döngü 5 bulgu 1): aynı döngüde kuyruğa alınan işler rezervi birikimli tüketir', () => {
  // sync-matches: hasQuotaForOptional(halftimeQueued + 1). Kalan 8, rezerv 6: yalnız 2 iş kuyruğa girer.
  const q = createQuotaGuard({ paid: false });
  q.set(8, T);
  let queued = 0;
  for (let i = 0; i < 4; i++) if (q.allows(6, queued + 1, T)) queued++;
  assertEquals(queued, 2); // 8 − 2 = 6: rezerv aynen kalır (eskiden 4 iş → kalan 4)
});
