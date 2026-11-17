// Akıllı alarm motoru birim testleri — çalıştırma: supabase/functions içinde `deno test`
import { assert, assertEquals } from 'jsr:@std/assert@1';
import { detectNbaRun, detectPressure, nbaRunAlert, pressureAlert, redCardAlerts, type Snapshot } from '../_shared/alerts.ts';
import type { MatchEvent } from '../_shared/types.ts';

const t = (m: number) => new Date(Date.UTC(2026, 10, 17, 19, m)).toISOString();
const fs = (min: number, hs: number, as: number, sotH: number, sotA: number, xgH: number, xgA: number): Snapshot => ({
  fixture_id: 1, taken_at: t(min), minute: min, home_score: hs, away_score: as,
  data: { sot: { home: sotH, away: sotA }, xg: { home: xgH, away: xgA } },
});
const hist = [fs(60, 1, 0, 3, 1, 0.9, 0.3), fs(62, 1, 0, 3, 2, 0.9, 0.55), fs(65, 1, 0, 4, 3, 1.0, 0.8)];

Deno.test('baskı alarmı: 10 dk içinde 4 isabetli şut, 1.10 xG, gol yok', () => {
  const hits = detectPressure(fs(70, 1, 0, 4, 5, 1.0, 1.4), hist);
  assertEquals(hits.length, 1);
  assertEquals(pressureAlert(1, 70, hits[0], 'Konuk FK').body, 'Son 10 dakikada Konuk FK 4 isabetli şut (1.10 xG) buldu, gol kapıda!');
});

Deno.test('baskı alarmı: eşik altı, gol olmuş veya pencere yoksa alarm yok', () => {
  assertEquals(detectPressure(fs(70, 1, 0, 4, 3, 1.0, 0.9), hist).length, 0);
  assertEquals(detectPressure(fs(70, 1, 1, 4, 5, 1.0, 1.4), hist).length, 0);
  assertEquals(detectPressure(fs(70, 1, 0, 4, 5, 1.0, 1.4), [fs(68, 1, 0, 4, 4, 1, 1)]).length, 0);
});

Deno.test('kırmızı kart: yalnız son 10 dakikadaki kart', () => {
  const ev: MatchEvent[] = [
    { minute: 66, team: 'home', type: 'red_card', player: 'A. Yılmaz' },
    { minute: 20, team: 'away', type: 'red_card', player: 'Eski' },
  ];
  const a = redCardAlerts(1, 70, ev, { home: 'Ev SK', away: 'Konuk FK' });
  assertEquals(a.length, 1);
  assert(a[0].body.startsWith("66' A. Yılmaz (Ev SK)"));
});

const n = (m: number, h: number, v: number): Snapshot => ({ fixture_id: 9, taken_at: t(m), minute: 3, home_score: h, away_score: v, data: null });

Deno.test('NBA serisi: 14-0, fark 2 sayıya indi; seri büyüse de aynı anahtar', () => {
  const base = [n(0, 60, 74), n(1, 60, 76), n(2, 64, 76), n(3, 69, 76), n(4, 72, 76), n(5, 74, 76)];
  const run = detectNbaRun(base)!;
  assertEquals(nbaRunAlert(9, run, 'Lakers').body, "3. çeyrekte Lakers 14-0'lık seri yakaladı, fark 2 sayıya indi!");
  const run2 = detectNbaRun([...base, n(6, 78, 76)])!;
  assertEquals(nbaRunAlert(9, run2, 'Lakers').dedupe_key, nbaRunAlert(9, run, 'Lakers').dedupe_key);
  assert(nbaRunAlert(9, run2, 'Lakers').body.includes('öne geçti'));
});

Deno.test('NBA serisi: rakip sayı bulunca seri kırılır', () => {
  assertEquals(detectNbaRun([n(0, 60, 74), n(1, 60, 76), n(2, 74, 77)]), null);
});
