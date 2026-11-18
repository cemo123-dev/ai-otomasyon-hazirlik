// NBA analiz birleştirme yedekleri (bulgu 6 ve 7) — çalıştırma: supabase/functions içinde `deno test`
import { assert, assertEquals } from 'jsr:@std/assert@1';
import { assembleNbaPayload, deterministicRun, nbaResultSentence, type NbaLlmOut, type NbaMatchRow } from '../_shared/nbaAnalysis.ts';
import { computeNbaMetrics, type NbaTeamBox } from '../_shared/nbaMetrics.ts';
import { hasFootballTerm } from '../_shared/sportTerms.ts';

const box = (points: number): NbaTeamBox => ({
  points, fgm: 40, fga: 85, ftm: 15, fta: 20, tpm: 12, tpa: 34, off_reb: 10, def_reb: 33, tot_reb: 43,
  assists: 25, turnovers: 12, steals: 7, blocks: 5, fouls: 18,
  points_in_paint: null, points_off_turnovers: null, second_chance_points: null, fast_break_points: null,
});

const row = (hs: number | null, as: number | null, periods = { home: [30, 35, 38, 33], away: [32, 30, 23, 35] }): NbaMatchRow => {
  const home = box(hs ?? 0);
  const away = box(as ?? 0);
  return {
    fixture_id: 1,
    home_team: 'Memphis Grizzlies',
    away_team: 'Washington Wizards',
    home_score: hs,
    away_score: as,
    status_short: 'FT',
    stats: { home, away, metrics: computeNbaMetrics({ home, away, periods, players: [] }, { home: 'Memphis Grizzlies', away: 'Washington Wizards' }) },
    top_players: [],
  };
};

// Tüm LLM metinleri futbol diliyle gelmiş
const footballOut: NbaLlmOut = {
  h: 'Grizzlies ikinci golü buldu',
  v: 'Teknik direktör hamlesi işe yaradı',
  et: 'efficient_offense',
  el: 'Forvet hattı verimli',
  ec: 'Orta saha üstünlüğü',
  qr: [
    { q: 3, s: 'E', t: 'Gol yağmuru', d: 'Korner sonrası seri' },
    { q: 1, s: 'D', t: 'Penaltı', d: 'Kaleci kurtardı' },
  ],
  lg: 'Son düdük',
  bh: 'Kanat bek',
  ba: 'Stoper',
  pi: 'Forvet',
  fp: 'Kırmızı kart',
  y: { n: 'Bilinmeyen Oyuncu', l: 'Golcü performansı' },
};

Deno.test('nbaResultSentence: null/eşit skorda nötr cümle, "0-0 kazandı" yok', () => {
  assertEquals(nbaResultSentence(row(136, 120)), 'Memphis Grizzlies, Washington Wizards karşısında 136-120 kazandı');
  assertEquals(nbaResultSentence(row(110, 118)), 'Washington Wizards, Memphis Grizzlies karşısında 118-110 kazandı');
  assertEquals(nbaResultSentence(row(null, null)), 'Memphis Grizzlies ile Washington Wizards maçı sona erdi');
  assertEquals(nbaResultSentence(row(100, 100)), 'Memphis Grizzlies ile Washington Wizards maçı 100-100 bitti');
  assertEquals(nbaResultSentence(row(null, 100)), 'Memphis Grizzlies ile Washington Wizards maçı sona erdi');
});

Deno.test('assembleNbaPayload: futbol dili tamamen yedeğe düşer; boş alan kalmaz', () => {
  const p = assembleNbaPayload(row(136, 120), footballOut);
  assertEquals(p.headline_title, 'Memphis Grizzlies, Washington Wizards karşısında 136-120 kazandı');
  assert(p.efficiency_audit.verdict_label.length > 0 && !hasFootballTerm(p.efficiency_audit.verdict_label));
  // LLM kırılmalarının hepsi atıldı → kırılma periyodundan tek deterministik satır
  assertEquals(p.quarter_runs.length, 1);
  assertEquals(p.quarter_runs[0].quarter, 3);
  assertEquals(p.quarter_runs[0].momentum, 'home');
  assert(p.player_performance_spotlight.headline.length > 0);
  for (const t of [p.headline_title, p.executive_tactical_verdict, p.quarter_runs[0].title, p.quarter_runs[0].description, p.player_performance_spotlight.headline]) {
    assert(!hasFootballTerm(t), t);
  }
});

Deno.test('assembleNbaPayload: null skorda başlık ve spotlight nötr', () => {
  const p = assembleNbaPayload(row(null, null), footballOut);
  assert(!/kazandı/.test(p.headline_title), p.headline_title);
  assert(!/0-0/.test(p.executive_tactical_verdict), p.executive_tactical_verdict);
  assertEquals(p.player_performance_spotlight.headline, 'Memphis Grizzlies ile Washington Wizards maçı sona erdi.');
});

Deno.test('assembleNbaPayload: temiz LLM kırılmaları korunur', () => {
  const p = assembleNbaPayload(row(136, 120), {
    ...footballOut,
    el: 'Verimli hücum',
    qr: [{ q: 3, s: 'E', t: 'Memphis koptu', d: 'Üçüncü çeyrekte 15 sayılık seri' }],
  });
  assertEquals(p.efficiency_audit.verdict_label, 'Verimli hücum');
  assertEquals(p.quarter_runs.map((r) => r.title), ['Memphis koptu']);
});

Deno.test('deterministicRun: periyot yoksa null', () => {
  assertEquals(deterministicRun(row(100, 90, { home: [], away: [] })), null);
});
