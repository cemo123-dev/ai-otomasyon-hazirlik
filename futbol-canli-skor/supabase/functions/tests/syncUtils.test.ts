// _shared/syncUtils.ts: tarih gruplama (biten maçların toplu durum güncellemesi), parçalama
// (push alıcı sorguları) ve "maç başladı" metni. Çalıştırma: npm run test:functions
import { assert, assertEquals, assertThrows } from 'jsr:@std/assert@1';
import {
  chunk,
  isFreePlanSlot,
  isMinutelyCadence,
  kickoffBody,
  kickoffWindowMinutes,
  localDate,
  remainingFromStatus,
  shouldRunSync,
  uniqueLocalDates,
} from '../_shared/syncUtils.ts';

const TZ = 'Europe/Istanbul';

Deno.test('syncUtils: İstanbul günü 21:00Z sınırında döner', () => {
  assertEquals(localDate('2026-11-16T20:59:59Z', TZ), '2026-11-16');
  assertEquals(localDate('2026-11-16T21:00:00Z', TZ), '2026-11-17');
  assertEquals(localDate('2026-11-17T00:30:00+03:00', TZ), '2026-11-17');
});

Deno.test('syncUtils: aynı günün maçları tek tarih isteğine düşer', () => {
  // Cumartesi 17:00 UTC civarı 4 ligden biten maçlar + gece yarısını geçen ŞL maçı
  const dates = uniqueLocalDates(
    [
      '2026-11-14T14:30:00Z',
      '2026-11-14T15:00:00Z',
      '2026-11-14T15:00:00Z',
      '2026-11-14T17:30:00Z',
      '2026-11-14T21:00:00Z', // TSİ 15 Kasım 00:00
    ],
    TZ,
  );
  assertEquals(dates, ['2026-11-14', '2026-11-15']);
});

Deno.test('syncUtils: geçersiz / boş zaman damgaları atlanır, sonuç sıralı', () => {
  assertEquals(uniqueLocalDates([null, undefined, '', 'bozuk', '2026-11-18T10:00:00Z', '2026-11-17T10:00:00Z'], TZ), [
    '2026-11-17',
    '2026-11-18',
  ]);
  assertEquals(uniqueLocalDates([], TZ), []);
});

Deno.test('syncUtils: chunk sınırları', () => {
  assertEquals(chunk([], 100), []);
  assertEquals(chunk([1, 2, 3], 100), [[1, 2, 3]]);
  assertEquals(chunk([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]]);
  const ids = Array.from({ length: 250 }, (_, i) => `uid-${i}`);
  const parts = chunk(ids, 100);
  assertEquals(parts.map((p) => p.length), [100, 100, 50]);
  assertEquals(parts.flat(), ids); // sıra ve eleman kaybı yok
  assertThrows(() => chunk([1], 0));
  assertThrows(() => chunk([1], 1.5));
});

Deno.test('syncUtils: maç başladı metni spora ve plana göre', () => {
  const fb = { sport: 'football' as const, home: 'Galatasaray', away: 'Fenerbahçe', minute: 2 };
  assertEquals(kickoffBody({ ...fb, paid: false }), 'Galatasaray - Fenerbahçe başladı.');
  assertEquals(
    kickoffBody({ ...fb, paid: true }),
    'Galatasaray - Fenerbahçe başladı. Devre arası raporu ve akıllı alarmlar takipte.',
  );
  // Geç yakalanan futbol maçında dakika yazılır
  assertEquals(kickoffBody({ ...fb, paid: false, minute: 27 }), "Galatasaray - Fenerbahçe başladı (27').");

  const nba = { sport: 'nba' as const, home: 'Lakers', away: 'Celtics', minute: 9 };
  const free = kickoffBody({ ...nba, paid: false });
  const paid = kickoffBody({ ...nba, paid: true });
  assertEquals(free, 'Lakers - Celtics başladı.');
  assertEquals(paid, 'Lakers - Celtics başladı. Seri alarmı takipte.');
  // NBA'de devre arası raporu yok; dakika (çeyrek dakikası) yazılmaz
  for (const t of [free, paid]) {
    assert(!/devre arası/i.test(t), t);
    assert(!t.includes("'"), t);
  }
});

Deno.test('remainingFromStatus: /status yanıtından kalan günlük istek (Döngü 3, bulgu 3)', () => {
  assertEquals(remainingFromStatus({ response: { requests: { current: 58, limit_day: 100 } } }), 42);
  assertEquals(remainingFromStatus({ response: [{ requests: { current: 120, limit_day: 100 } }] }), 0);
  assertEquals(remainingFromStatus({ response: [] }), null);
  assertEquals(remainingFromStatus({ errors: { token: 'x' } }), null);
  assertEquals(remainingFromStatus(null), null);
});

// ─────────────────────────────────────────────── 0018: dakikalık cron'un ücretsiz plan emniyeti
const U = (iso: string) => new Date(iso);

Deno.test('isFreePlanSlot: 0004 takvimi (canlı */30 12-22, fikstür 0 9) birebir', () => {
  // Canlı: 12:00-22:30 UTC arası yalnız :00 ve :30 → günde 22 çalıştırma (eskisiyle aynı)
  let live = 0;
  let schedule = 0;
  for (let m = 0; m < 24 * 60; m++) {
    const at = new Date(Date.UTC(2026, 10, 21, 0, m));
    if (isFreePlanSlot('live', at)) live++;
    if (isFreePlanSlot('schedule', at)) schedule++;
  }
  assertEquals(live, 22);
  assertEquals(schedule, 1);
  assert(isFreePlanSlot('live', U('2026-11-21T12:00:00Z')));
  assert(isFreePlanSlot('live', U('2026-11-21T22:30:59Z')));
  assertEquals(isFreePlanSlot('live', U('2026-11-21T11:30:00Z')), false);
  assertEquals(isFreePlanSlot('live', U('2026-11-21T23:00:00Z')), false);
  assertEquals(isFreePlanSlot('live', U('2026-11-21T12:01:00Z')), false);
  assert(isFreePlanSlot('schedule', U('2026-11-21T09:00:00Z')));
  assertEquals(isFreePlanSlot('schedule', U('2026-11-21T15:00:00Z')), false);
});

Deno.test('shouldRunSync: secret kapalıyken "paid" tempo ücretsiz takvime iner', () => {
  const now = U('2026-11-21T14:07:00Z');
  // Eski cron gövdesi ve skor-sync-cleanup (cadence yok) hep çalışır
  assert(shouldRunSync({ mode: 'live', paid: false, now }));
  assert(shouldRunSync({ mode: 'live', paid: false, cadence: 'free', now }));
  // DB ücretli, secret ücretli → her dakika
  assert(shouldRunSync({ mode: 'live', paid: true, cadence: 'paid', now }));
  // DB ücretli, secret KAPALI → yalnız ücretsiz dakikalar (slot SQL'den gelir; pg_net gecikmesi etkilemez)
  assertEquals(shouldRunSync({ mode: 'live', paid: false, cadence: 'paid', slot: '2026-11-21T14:07:00Z', now }), false);
  assert(shouldRunSync({ mode: 'live', paid: false, cadence: 'paid', slot: '2026-11-21T14:30:00+00:00', now: U('2026-11-21T14:31:10Z') }));
  // Döngü 8 bulgu 3: fikstür DB ücretli + secret kapalıyken de çalışır (03:00 / 15:00; ücretsiz yol, 3 gün)
  assert(shouldRunSync({ mode: 'schedule', paid: false, cadence: 'paid', slot: '2026-11-21T15:00:00Z', now }));
  assert(shouldRunSync({ mode: 'schedule', paid: false, cadence: 'paid', now: U('2026-11-21T03:00:40Z') }));
  assert(shouldRunSync({ mode: 'schedule', paid: false, cadence: 'paid', slot: '2026-11-21T09:00:00Z', now }));
  // Bozuk slot → Edge saati
  assertEquals(shouldRunSync({ mode: 'live', paid: false, cadence: 'paid', slot: 'x', now }), false);
});

Deno.test('kickoffWindowMinutes: ücretsiz 35 dk, ücretli 5 dk', () => {
  assertEquals(kickoffWindowMinutes(false), 35);
  assertEquals(kickoffWindowMinutes(true), 5);
});

// Döngü 8 bulgu 3: DB ücretli + secret kapalı bir gün boyunca — canlı 22, fikstür her ücretli çağrıda (2)
Deno.test('shouldRunSync: DB ücretli + secret kapalı günde canlı 22, fikstür 2 çalıştırma', () => {
  let live = 0;
  let schedule = 0;
  for (let m = 0; m < 24 * 60; m++) {
    const at = new Date(Date.UTC(2026, 10, 21, 0, m));
    const h = at.getUTCHours();
    // 0018 ücretli takvimi: canlı * 9-23, fikstür 0 3,15
    if (h >= 9 && shouldRunSync({ mode: 'live', paid: false, cadence: 'paid', now: at })) live++;
    if ((h === 3 || h === 15) && at.getUTCMinutes() === 0 && shouldRunSync({ mode: 'schedule', paid: false, cadence: 'paid', now: at })) schedule++;
  }
  assertEquals(live, 22);
  assertEquals(schedule, 2);
});

// Döngü 8 bulgu 6: "maç başladı" penceresi isteğin temposundan (secret tek başına değil)
Deno.test('isMinutelyCadence: yalnız secret açık + cadence paid dakikalıktır', () => {
  assertEquals(isMinutelyCadence(true, 'paid'), true);
  assertEquals(isMinutelyCadence(true, undefined), false); // secret açık + DB ücretsiz (30 dk cron)
  assertEquals(isMinutelyCadence(false, 'paid'), false); // DB ücretli + secret kapalı (ücretsiz dilimler)
  assertEquals(isMinutelyCadence(false, undefined), false);
  assertEquals(kickoffWindowMinutes(isMinutelyCadence(true, undefined)), 35);
  assertEquals(kickoffWindowMinutes(isMinutelyCadence(true, 'paid')), 5);
});

// Döngü 8 bulgu 6–8: sync-matches kaynağı — pencere tempodan, canlı detay rezervli, gün sayısı app_config'ten
Deno.test('sync-matches: kickoff penceresi, kota freni ve fikstür gün kaynağı (kaynak tarama)', async () => {
  const src = await Deno.readTextFile(new URL('../sync-matches/index.ts', import.meta.url));
  assert(src.includes('syncLive(isMinutelyCadence(PAID, cadence))'));
  assert(src.includes('kickoffWindowMinutes(minutely)'));
  assert(!src.includes('kickoffWindowMinutes(PAID)'));
  assert(/const liveDetail = PAID && liveIds\.size > 0 && hasQuotaForOptional\(/.test(src));
  assert(src.includes("admin.rpc('fixture_days_ahead')"));
});
