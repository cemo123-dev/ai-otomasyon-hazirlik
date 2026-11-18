// _shared/quota.ts: spor başına ayrı kota bekçisi (F12a), UTC gece yarısı sıfırlaması ve
// /status önbelleğinin ~10 dk'lık tazelenmesi (test bulgusu Döngü 4 #7). Çalıştırma: npm run test:functions
import { assert, assertEquals } from 'jsr:@std/assert@1';
import {
  createQuotaGuard,
  DEFAULT_RESERVES,
  envNumber,
  footballOptionalReserve,
  FREE_FOOTBALL_RESERVE_MAX,
  QUOTA_TTL_MS,
  utcDay,
} from '../_shared/quota.ts';

const T = Date.UTC(2026, 10, 18, 12, 0, 0);

Deno.test('quota: bilinmeyen kota izin verir ve tazelenmeli sayılır', () => {
  const q = createQuotaGuard({ paid: false });
  assertEquals(q.remaining(T), null);
  assert(q.stale(T));
  assert(q.allows(6, 1, T));
});

Deno.test('quota: rezerv eşiği (needed istekten sonra en az reserve kalmalı)', () => {
  const q = createQuotaGuard({ paid: false });
  q.set(7, T);
  assert(q.allows(6, 1, T)); // 7 - 1 = 6 ≥ 6
  q.set(6, T);
  assertEquals(q.allows(6, 1, T), false);
  q.set(12, T);
  assert(q.allows(5, 1 + 6, T)); // NBA geri doldurma: 12 - 7 = 5 ≥ 5
  q.set(11, T);
  assertEquals(q.allows(5, 7, T), false);
});

// Döngü 8 bulgu 7: ücretli planda da rezerv freni (FOOTBALL_QUOTA_RESERVE_PAID, varsayılan 500); ücretsiz davranış aynı
Deno.test('quota: ücretli planda isteğe bağlı çekim yalnız kalan > rezerv iken', () => {
  const q = createQuotaGuard({ paid: true });
  assert(q.allows(500, 3, T)); // kota henüz bilinmiyor → izin (ilk yanıt başlığı tazeler)
  q.set(7000, T);
  assert(q.allows(500, 3, T));
  q.set(503, T);
  assert(q.allows(500, 3, T)); // 503 - 3 = 500 ≥ 500
  assertEquals(q.allows(500, 4, T), false);
  q.set(0, T);
  assertEquals(q.allows(500, 1, T), false); // döngü/hata 7.500'ü bitirmeden durur
  assertEquals(q.allows(100, 50, T), false); // eskiden ücretli planda hep true dönerdi
  // Ücretli ve ücretsiz bekçi aynı kalan + rezervde aynı kararı verir
  const free = createQuotaGuard({ paid: false });
  for (const rem of [0, 5, 6, 7, 12, 600]) {
    q.set(rem, T);
    free.set(rem, T);
    assertEquals(q.allows(6, 1, T), free.allows(6, 1, T), String(rem));
  }
});

// Döngü 9 bulgu 1: rezerv plana göre seçilir; geri dönüşte eski FOOTBALL_QUOTA_RESERVE=500 ücretsizi kilitlemez
Deno.test('quota: futbol isteğe bağlı rezervi plana göre (FOOTBALL_QUOTA_RESERVE / _PAID)', () => {
  // Ücretsiz: varsayılan 6, ücretli env'i okunmaz
  assertEquals(footballOptionalReserve(false, undefined, undefined), 6);
  assertEquals(footballOptionalReserve(false, undefined, '900'), 6);
  assertEquals(footballOptionalReserve(false, '10', undefined), 10);
  // Ücretli: varsayılan 500, ücretsiz env'i okunmaz
  assertEquals(footballOptionalReserve(true, undefined, undefined), 500);
  assertEquals(footballOptionalReserve(true, '6', undefined), 500);
  assertEquals(footballOptionalReserve(true, '6', '800'), 800);
  assertEquals(footballOptionalReserve(true, undefined, 'abc'), 500);
  // Geri dönüşte unutulmuş FOOTBALL_QUOTA_RESERVE=500: ücretsiz planda en fazla 50
  const leftover = footballOptionalReserve(false, '500', undefined);
  assertEquals(leftover, FREE_FOOTBALL_RESERVE_MAX);
  const free = createQuotaGuard({ paid: false });
  free.set(100, T); // gün başı (ücretsiz kota 100)
  assert(free.allows(leftover, 1, T)); // eskiden 100 - 1 < 500 → hep false
  free.set(60, T);
  assert(free.allows(leftover, 3, T));
  assert(FREE_FOOTBALL_RESERVE_MAX < 100);
  assert(DEFAULT_RESERVES.footballOptional <= FREE_FOOTBALL_RESERVE_MAX);
});

Deno.test('quota: futbol ve NBA bekçileri birbirinin sayacını etkilemez', () => {
  const football = createQuotaGuard({ paid: false });
  const nba = createQuotaGuard({ paid: false });
  football.set(4, T);
  nba.set(90, T);
  assertEquals(football.allows(DEFAULT_RESERVES.footballOptional, 1, T), false);
  assert(nba.allows(DEFAULT_RESERVES.nbaOptional, 2, T));
  assertEquals(football.remaining(T), 4);
  assertEquals(nba.remaining(T), 90);
});

Deno.test('quota: önceki UTC gününün değeri gece yarısından sonra geçersiz (bulgu 7)', () => {
  const q = createQuotaGuard({ paid: false });
  const before = Date.UTC(2026, 10, 18, 23, 55);
  const after = Date.UTC(2026, 10, 19, 0, 1);
  q.set(3, before);
  assertEquals(q.allows(6, 1, before), false);
  assertEquals(q.remaining(after), null);
  assert(q.stale(after));
  assert(q.allows(6, 1, after));
  assert(utcDay(after) === utcDay(before) + 1);
});

Deno.test('quota: aynı gün içinde ~10 dk sonra /status yeniden sorulur', () => {
  const q = createQuotaGuard({ paid: false });
  q.set(40, T);
  assertEquals(q.stale(T + QUOTA_TTL_MS - 1), false);
  assert(q.stale(T + QUOTA_TTL_MS + 1));
  // Bayat ama aynı gün: değer hâlâ kullanılır (alt sınır değil, en iyi bilgi)
  assertEquals(q.remaining(T + QUOTA_TTL_MS + 1), 40);
  q.set(39, T + QUOTA_TTL_MS + 1);
  assertEquals(q.stale(T + QUOTA_TTL_MS + 2), false);
});

Deno.test('quota: varsayılan rezervler ayrı kotaya göre küçük (F12a)', () => {
  assertEquals(DEFAULT_RESERVES.footballOptional, 6);
  assertEquals(DEFAULT_RESERVES.footballOptionalPaid, 500);
  assertEquals(DEFAULT_RESERVES.footballStatusFloor, 3);
  assertEquals(DEFAULT_RESERVES.nbaOptional, 5);
  assertEquals(DEFAULT_RESERVES.nbaBoxBackfill, 6);
  assert(DEFAULT_RESERVES.footballStatusFloor < DEFAULT_RESERVES.footballOptional);
});

Deno.test('quota: geçersiz değerler yok sayılır, negatif kalan 0 olur', () => {
  const q = createQuotaGuard({ paid: false });
  q.set(Number.NaN, T);
  assertEquals(q.remaining(T), null);
  q.set(-3, T);
  assertEquals(q.remaining(T), 0);
});

Deno.test('quota: envNumber boş/geçersiz değerde varsayılana döner', () => {
  assertEquals(envNumber(undefined, 6), 6);
  assertEquals(envNumber('', 6), 6);
  assertEquals(envNumber('  ', 6), 6);
  assertEquals(envNumber('abc', 6), 6);
  assertEquals(envNumber('-1', 6), 6);
  assertEquals(envNumber('0', 6), 0);
  assertEquals(envNumber('12', 6), 12);
});
