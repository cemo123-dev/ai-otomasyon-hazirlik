// src/lib/days.ts (istemci tarih şeridi) sınır testleri — saf modül, Deno'dan doğrudan içe aktarılır.
// Çalıştırma: npm run test:functions
import { assertEquals, assertThrows } from 'jsr:@std/assert@1';
import {
  DAY_OFFSETS,
  dayKeyFromToday,
  dayLabel,
  dayOffsetsFor,
  istanbulDayKey,
  istanbulDayStartMs,
  PAID_MAX_DAY_OFFSET,
} from '../../../src/lib/days.ts';
import { fixtureDayOffsets, MAX_FIXTURE_DAYS_AHEAD } from '../_shared/syncUtils.ts';

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

// ─────────────────────────────────────────────── 0018 Pro API: −1…+7 gün şeridi
Deno.test('days: dayOffsetsFor — ücretli 9 gün, ücretsiz/bilinmiyor 3 gün', () => {
  assertEquals(dayOffsetsFor(true), [-1, 0, 1, 2, 3, 4, 5, 6, 7]);
  assertEquals(dayOffsetsFor(false), [-1, 0, 1]);
  assertEquals(dayOffsetsFor(null), [-1, 0, 1]); // plan bilinmiyorken genişlemez
  assertEquals(dayOffsetsFor(undefined), DAY_OFFSETS);
  // Döngü 8 bulgu 8: sunucunun fikstür gün sayısı (0019 fixture_days_ahead) şeridi kısaltır, boş gün yok
  assertEquals(dayOffsetsFor(true, 3), [-1, 0, 1, 2, 3]);
  assertEquals(dayOffsetsFor(true, 1), [-1, 0, 1]);
  assertEquals(dayOffsetsFor(true, 7), [-1, 0, 1, 2, 3, 4, 5, 6, 7]);
  assertEquals(dayOffsetsFor(true, null), [-1, 0, 1, 2, 3, 4, 5, 6, 7]); // bilinmiyor → sunucu varsayılanı 7
  assertEquals(dayOffsetsFor(true, 0), [-1, 0, 1]); // 1…7'ye kırpılır (sunucu fixtureDayOffsets ile aynı)
  assertEquals(dayOffsetsFor(true, 12), [-1, 0, 1, 2, 3, 4, 5, 6, 7]);
  assertEquals(dayOffsetsFor(true, 4.9), [-1, 0, 1, 2, 3, 4]);
  assertEquals(dayOffsetsFor(false, 5), [-1, 0, 1]);
  // İstemci ve sunucu aynı değerde aynı son günü kullanır
  for (const n of [1, 2, 3, 5, 7]) {
    assertEquals(dayOffsetsFor(true, n), fixtureDayOffsets(true, String(n)));
  }
});

Deno.test('days: 2+ gün etiketi kısa gün adı + tarih', () => {
  const now = T('2026-11-18T12:00:00Z'); // Çarşamba, İstanbul 15:00
  assertEquals(dayLabel(1, now), { title: 'Yarın', sub: '19 Kas' });
  assertEquals(dayLabel(2, now), { title: 'Cum', sub: '20 Kas' });
  assertEquals(dayLabel(3, now), { title: 'Cmt', sub: '21 Kas' });
  assertEquals(dayLabel(5, now), { title: 'Pzt', sub: '23 Kas' });
  assertEquals(dayLabel(7, now), { title: 'Çar', sub: '25 Kas' });
});

Deno.test('days: +7 TSİ gece yarısı sınırında doğru gün', () => {
  // UTC 20:59:59 = TSİ 23:59:59 (18 Kas, Çar) → +7 = 25 Kas Çar; 21:00 UTC = TSİ 19 Kas → +7 = 26 Kas Per
  assertEquals(dayLabel(7, T('2026-11-18T20:59:59Z')), { title: 'Çar', sub: '25 Kas' });
  assertEquals(dayLabel(7, T('2026-11-18T21:00:00Z')), { title: 'Per', sub: '26 Kas' });
  // Ay ve yıl geçişi
  assertEquals(dayLabel(7, T('2026-12-28T10:00:00Z')), { title: 'Pzt', sub: '4 Oca' });
  // İstemci sorgu penceresi (listMatches daysAhead=7): dün başından +7 sonuna tam 9 gün
  const now = T('2026-11-18T23:59:00+03:00');
  assertEquals(istanbulDayStartMs(PAID_MAX_DAY_OFFSET + 1, now) - istanbulDayStartMs(-1, now), 9 * 86400_000);
});

Deno.test('fixtureDayOffsets: ücretsiz plan hep −1…+1 (istek sayısı eskisiyle aynı)', () => {
  assertEquals(fixtureDayOffsets(false), [-1, 0, 1]);
  assertEquals(fixtureDayOffsets(false, '7'), [-1, 0, 1]); // FIXTURE_DAYS_AHEAD ücretsizde yok sayılır
  assertEquals(fixtureDayOffsets(true), [-1, 0, 1, 2, 3, 4, 5, 6, 7]);
  assertEquals(fixtureDayOffsets(true, ''), [-1, 0, 1, 2, 3, 4, 5, 6, 7]);
  assertEquals(fixtureDayOffsets(true, '3'), [-1, 0, 1, 2, 3]);
  assertEquals(fixtureDayOffsets(true, '0'), [-1, 0, 1]); // en az yarın
  assertEquals(fixtureDayOffsets(true, '30'), [-1, 0, 1, 2, 3, 4, 5, 6, 7]); // en çok 7
  assertEquals(fixtureDayOffsets(true, 'abc'), [-1, 0, 1, 2, 3, 4, 5, 6, 7]);
  // Sunucu ve istemci üst sınırı aynı
  assertEquals(MAX_FIXTURE_DAYS_AHEAD, PAID_MAX_DAY_OFFSET);
});
