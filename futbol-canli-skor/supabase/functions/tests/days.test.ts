// src/lib/days.ts (istemci tarih şeridi) sınır testleri — saf modül, Deno'dan doğrudan içe aktarılır.
// Çalıştırma: npm run test:functions
import { assertEquals, assertThrows } from 'jsr:@std/assert@1';
import { dayKeyFromToday, dayLabel, istanbulDayKey, istanbulDayStartMs } from '../../../src/lib/days.ts';

const T = (iso: string) => Date.parse(iso);

Deno.test('days: İstanbul gece yarısı = 21:00Z sınırı', () => {
  assertEquals(istanbulDayKey('2026-11-16T20:59:59.999Z'), '2026-11-16');
  assertEquals(istanbulDayKey('2026-11-16T21:00:00.000Z'), '2026-11-17');
  // API tarih ofsetli gelir
  assertEquals(istanbulDayKey('2026-11-17T00:30:00+03:00'), '2026-11-17');
});

Deno.test('days: istanbulDayStartMs sınırda doğru gün başlangıcı', () => {
  assertEquals(istanbulDayStartMs(0, T('2026-11-16T21:00:00Z')), T('2026-11-16T21:00:00Z'));
  assertEquals(istanbulDayStartMs(0, T('2026-11-16T20:59:59.999Z')), T('2026-11-15T21:00:00Z'));
  assertEquals(istanbulDayStartMs(-1, T('2026-11-17T12:00:00Z')), T('2026-11-15T21:00:00Z'));
  assertEquals(istanbulDayStartMs(2, T('2026-11-17T12:00:00Z')), T('2026-11-18T21:00:00Z'));
});

Deno.test('days: yıl/ay geçişi ve artık gün', () => {
  const now = T('2026-12-31T21:30:00Z'); // İstanbul 2027-01-01 00:30
  assertEquals(dayKeyFromToday(0, now), '2027-01-01');
  assertEquals(dayKeyFromToday(-1, now), '2026-12-31');
  assertEquals(dayLabel(-1, now), { title: 'Dün', sub: '31 Ara' });
  assertEquals(dayLabel(1, T('2028-02-28T10:00:00Z')).sub, '29 Şub');
});

Deno.test('days: istemci sorgu penceresi [dün başı, yarın sonu) tam 3 gün', () => {
  const now = T('2026-11-17T23:59:00+03:00');
  assertEquals(istanbulDayStartMs(2, now) - istanbulDayStartMs(-1, now), 3 * 86400_000);
  // pencerenin son anı yarın, ilk anı dün
  assertEquals(istanbulDayKey(istanbulDayStartMs(2, now) - 1), dayKeyFromToday(1, now));
  assertEquals(istanbulDayKey(istanbulDayStartMs(-1, now)), dayKeyFromToday(-1, now));
});

Deno.test('days: Türkiye sabit UTC+3 — yaz/kış ayında fark yok', () => {
  assertEquals(istanbulDayKey('2026-07-01T20:59:00Z'), '2026-07-01');
  assertEquals(istanbulDayKey('2026-07-01T21:00:00Z'), '2026-07-02');
  assertEquals(istanbulDayKey('2026-01-01T21:00:00Z'), '2026-01-02');
});

Deno.test('days (bulgu adayı): geçersiz kickoff_at RangeError atar -> useMatches render çöker', () => {
  assertThrows(() => istanbulDayKey('not-a-date'), RangeError);
  // null -> new Date(null) = 1970 -> '1970-01-01' (çökmez, sessizce süzülür)
  assertEquals(istanbulDayKey(null as unknown as string), '1970-01-01');
});
