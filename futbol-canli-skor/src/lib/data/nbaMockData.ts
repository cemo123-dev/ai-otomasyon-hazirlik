import type { Match, NbaStats, NbaTacticalPayload } from '../types';

// Önizleme verisi — tüm NBA takım ve oyuncu adları kurgusaldır.
// Metrikler supabase/functions/_shared/nbaMetrics.ts formülleriyle tutarlıdır.

const hoursFromNow = (h: number) => new Date(Date.now() + h * 3600_000).toISOString();

/** Ana senaryo: 48 üçlük deneyip %50 TS% ile kaybeden takım ("verimsiz hacim tuzağı") */
export const NBA_SCENARIO_ID = 9_000_009_101;

const scenarioStats: NbaStats = {
  home: {
    points: 104, fgm: 38, fga: 96, ftm: 15, fta: 18, tpm: 13, tpa: 48,
    off_reb: 14, def_reb: 31, tot_reb: 45, assists: 22, turnovers: 16, steals: 7, blocks: 4, fouls: 20,
    points_in_paint: 36, points_off_turnovers: 12, second_chance_points: 15, fast_break_points: 9,
  },
  away: {
    points: 115, fgm: 43, fga: 84, ftm: 18, fta: 26, tpm: 11, tpa: 29,
    off_reb: 9, def_reb: 38, tot_reb: 47, assists: 27, turnovers: 9, steals: 10, blocks: 6, fouls: 17,
    points_in_paint: 54, points_off_turnovers: 21, second_chance_points: 8, fast_break_points: 16,
  },
  metrics: {
    ts: { home: 50.0, away: 60.2, diff: -10.2 },
    shooting: {
      home: { fg_pct: 39.6, tp_pct: 27.1, fga: 96, tpa: 48, three_rate: 50.0 },
      away: { fg_pct: 51.2, tp_pct: 37.9, fga: 84, tpa: 29, three_rate: 34.5 },
    },
    volume_trap: { team: 'home', extra_fga: 12, extra_tpa: 19, ts_gap: 10.2 },
    quarters: [
      { quarter: 1, label: '1. Çeyrek', home_pts: 28, away_pts: 25, swing: 3, score_after: '28-25', leader_after: 'home' },
      { quarter: 2, label: '2. Çeyrek', home_pts: 27, away_pts: 30, swing: -3, score_after: '55-55', leader_after: 'tie' },
      { quarter: 3, label: '3. Çeyrek', home_pts: 22, away_pts: 34, swing: -12, score_after: '77-89', leader_after: 'away' },
      { quarter: 4, label: '4. Çeyrek', home_pts: 27, away_pts: 26, swing: 1, score_after: '104-115', leader_after: 'away' },
    ],
    decisive: {
      quarter: 3, label: '3. Çeyrek', team: 'away', margin: 12, kind: 'comeback',
      text: '3. Çeyrekte +12 sayılık seri (Desert Vipers): geri dönüşü başlatan periyot',
    },
    possession: {
      off_reb: { home: 14, away: 9 },
      turnovers: { home: 16, away: 9 },
      extra_possessions_home: -2,
      points_in_paint: { home: 36, away: 54 },
      points_off_turnovers: { home: 12, away: 21 },
      second_chance_points: { home: 15, away: 8 },
    },
    bench: {
      home: { starters_pm_avg: -6.2, bench_pm_avg: -3.4, starters_points: 78, bench_points: 26 },
      away: { starters_pm_avg: 7.0, bench_pm_avg: 2.6, starters_points: 81, bench_points: 34 },
      bench_points_diff_home: -8,
    },
    late_game: { q4_home: 27, q4_away: 26, final_margin: 11, close_game: false },
    winner: 'away',
  },
};

const base = { league_name: 'NBA', league_country: 'ABD', league_priority: 1, events: null, sport_type: 'nba' as const };

export const nbaMatches: Match[] = [
  {
    ...base,
    fixture_id: NBA_SCENARIO_ID,
    kickoff_at: hoursFromNow(-4),
    home_team: 'Lakeshore Comets',
    away_team: 'Desert Vipers',
    home_score: 104,
    away_score: 115,
    status_short: 'FT',
    elapsed_minute: 4,
    status_detail: 'Maç Sonu',
    period_scores: { home: [28, 27, 22, 27], away: [25, 30, 34, 26] },
    summary_teaser:
      'Lakeshore Comets 104-115 Desert Vipers. TS% 50-60.2. 3. Çeyrekte +12 sayılık seri (Desert Vipers): geri dönüşü başlatan periyot. Lakeshore Comets daha fazla şut ve üçlük denedi ama TS%\'de 10.2 puan geride kaldı.',
    analysis_status: 'none',
    stats: scenarioStats as unknown as Match['stats'],
  },
  {
    ...base,
    fixture_id: 9_000_009_102,
    kickoff_at: hoursFromNow(-1.5),
    home_team: 'Northgate Titans',
    away_team: 'Riverside Rapids',
    home_score: 73,
    away_score: 73,
    status_short: 'LIVE',
    elapsed_minute: 3,
    status_detail: 'Q3 04:12',
    period_scores: { home: [27, 31, 15], away: [29, 26, 18] },
    summary_teaser: null,
    analysis_status: 'none',
    stats: null,
  },
  {
    ...base,
    fixture_id: 9_000_009_103,
    kickoff_at: hoursFromNow(5),
    home_team: 'Capital Monarchs',
    away_team: 'Pacific Surfers',
    home_score: null,
    away_score: null,
    status_short: 'NS',
    elapsed_minute: null,
    status_detail: null,
    period_scores: null,
    summary_teaser: null,
    analysis_status: 'none',
    stats: null,
  },
];

export const nbaScenarioPayload: NbaTacticalPayload = {
  sport: 'nba',
  headline_title: 'Verimsiz Hacim Tuzağı: 48 Üçlük, %50 TS',
  executive_tactical_verdict:
    'Lakeshore Comets şutlarının yarısını üçlükten kullandı ama yalnızca %27,1 isabet buldu; TS% %50,0\'da kaldı. Desert Vipers daha az şutla boyalı alanda 54 sayı üretti ve %60,2 TS% ile maçı verimlilikle kazandı. 3. çeyrekteki +12\'lik seri, ilk yarının dengesini bozan kırılma oldu.',
  efficiency_audit: {
    verdict_type: 'inefficient_volume',
    verdict_label: 'Hacim ↔ Verimlilik',
    home: { ts_pct: 50.0, fg_pct: 39.6, tp_pct: 27.1, fga: 96, tpa: 48, points: 104 },
    away: { ts_pct: 60.2, fg_pct: 51.2, tp_pct: 37.9, fga: 84, tpa: 29, points: 115 },
    volume_trap_team: 'home',
    commentary:
      'Comets 12 fazla şut ve 19 fazla üçlük denedi ama TS%\'de 10,2 puan geride kaldı. Vipers\'ın boyalı alan üstünlüğü (54-36) daha yüksek yüzdeli şutlar demekti.',
  },
  quarter_runs: [
    { quarter: 1, label: '1. Çeyrek', home_pts: 28, away_pts: 25, swing: 3, score_after: '28-25', title: 'Comets erken öne geçti', description: 'İlk çeyrekte üçlükler düştü ve ev sahibi 3 sayı önde kapattı.', momentum: 'home' },
    { quarter: 3, label: '3. Çeyrek', home_pts: 22, away_pts: 34, swing: -12, score_after: '77-89', title: 'Vipers\'ın 12 sayılık serisi', description: 'İlk yarıyı 55-55 kapatan skor, boyalı alan atakları ve top kayıplarından gelen sayılarla 12 farka açıldı.', momentum: 'away' },
    { quarter: 4, label: '4. Çeyrek', home_pts: 27, away_pts: 26, swing: 1, score_after: '104-115', title: 'Geri dönüş gelmedi', description: 'Comets son çeyreği 1 sayı farkla kazandı ama 12 sayılık açığı kapatamadı.', momentum: 'neutral' },
  ],
  late_game: {
    close_game: false, q4_home: 27, q4_away: 26, final_margin: 11,
    commentary: 'Son çeyrek dengeli geçti (27-26); maç 3. çeyrekte belirlendiği için final farkı 11 sayıda kaldı.',
  },
  bench_impact: {
    home: { starters_pm_avg: -6.2, bench_pm_avg: -3.4, bench_points: 26, commentary: 'Comets\'in ilk beşi ortalama -6,2 ile maçın kaybedildiği dakikalarda sahadaydı.' },
    away: { starters_pm_avg: 7.0, bench_pm_avg: 2.6, bench_points: 34, commentary: 'Vipers\'ın yedekleri 34 sayıyla katkı verdi ve ilk beşin yarattığı farkı korudu.' },
  },
  possession_battle: scenarioStats.metrics.possession,
  player_impact: {
    offense: [
      { name: 'Marcus Vale', team: 'away', starter: true, minutes: 36, score: 26.4, line: '31 sy, 5 ast, 2 TO, 13/19 FG' },
      { name: 'Theo Brandt', team: 'away', starter: true, minutes: 33, score: 15.1, line: '19 sy, 9 ast, 3 TO, 7/12 FG' },
      { name: 'Jalen Ross', team: 'home', starter: true, minutes: 38, score: 9.8, line: '27 sy, 4 ast, 5 TO, 9/24 FG' },
    ],
    defense: [
      { name: 'Ivo Kral', team: 'away', starter: true, minutes: 30, score: 6.2, line: '2 çalma, 4 blok, 9 sav. rib, 2 faul' },
      { name: 'Theo Brandt', team: 'away', starter: true, minutes: 33, score: 4.1, line: '3 çalma, 0 blok, 5 sav. rib, 1 faul' },
      { name: 'Dre Collins', team: 'home', starter: false, minutes: 22, score: 2.9, line: '2 çalma, 1 blok, 4 sav. rib, 2 faul' },
    ],
    foul_trouble: [
      { name: 'Omar Haddad', team: 'home', starter: true, fouls: 6, fouled_out: true, minutes: 21, points: 6, plus_minus: -13 },
      { name: 'Ivo Kral', team: 'away', starter: true, fouls: 5, fouled_out: false, minutes: 30, points: 12, plus_minus: 9 },
    ],
    commentary:
      'Vipers\'ın hücum yükünü Marcus Vale verimli şutla taşıdı (13/19); Comets\'te Jalen Ross 27 sayıya 24 şutla ulaştı ve hacim tuzağının yüzü oldu. Savunmada Ivo Kral\'ın 4 bloğu boyalı alanı kapattı.',
    foul_commentary:
      'Comets\'in ilk beşinden Omar Haddad 6 faulla oyundan atıldı ve sahada kaldığı 21 dakikada takımı -13\'te kaldı; Kral ise 5 faula rağmen sahada kalıp savunmayı sürdürdü.',
  },
  player_performance_spotlight: {
    player: 'Marcus Vale',
    team: 'away',
    position: 'Forward',
    rating: 31,
    headline: 'Boyalı alanda durdurulamadı: 31 sayı, 11 ribaund',
    key_stats: [
      { label: 'Sayı', value: '31' },
      { label: 'Ribaund', value: '11' },
      { label: 'Asist', value: '5' },
      { label: '+/-', value: '+14' },
      { label: 'Saha içi', value: '13/19' },
      { label: 'Üçlük', value: '1/2' },
    ],
  },
};

// ─────────────────────────────────────────────── önizleme: box score (Lakeshore 104 - 115 Desert)
type BoxRow = [string, string, boolean, number, number, number, number, number, number, number, number, number, number, number, number, number];
// ad, poz, ilk5, dk, sayı, rib, ast, +/-, isabet, deneme, üçlük isabet, üçlük deneme, SA isabet, SA deneme, top çalma, top kaybı
const H: BoxRow[] = [
  ['M. Reyes', 'G', true, 36, 24, 4, 7, -6, 9, 21, 3, 9, 3, 4, 1, 3],
  ['T. Okafor', 'F', true, 34, 18, 9, 2, -10, 7, 16, 1, 5, 3, 4, 1, 2],
  ['J. Lindqvist', 'C', true, 30, 14, 11, 1, -8, 6, 10, 0, 0, 2, 4, 0, 1],
  ['D. Carter', 'G', true, 32, 12, 3, 5, -12, 4, 13, 2, 8, 2, 2, 2, 3],
  ['A. Brooks', 'F', true, 28, 10, 6, 2, -9, 4, 11, 2, 7, 0, 0, 0, 1],
  ['K. Ndiaye', 'C', false, 18, 12, 5, 1, 3, 5, 8, 0, 1, 2, 3, 1, 1],
  ['P. Santos', 'G', false, 22, 8, 2, 4, -4, 3, 9, 2, 6, 0, 0, 1, 2],
  ['R. Hale', 'F', false, 16, 6, 3, 0, -9, 2, 6, 1, 4, 1, 2, 0, 0],
];
const A: BoxRow[] = [
  ['L. Moreau', 'G', true, 35, 29, 5, 6, 14, 10, 18, 4, 7, 5, 6, 2, 2],
  ['C. Whitfield', 'F', true, 33, 21, 8, 3, 10, 8, 14, 2, 4, 3, 3, 1, 1],
  ['B. Adeyemi', 'C', true, 31, 16, 12, 2, 9, 7, 10, 0, 0, 2, 3, 0, 2],
  ['S. Kowalski', 'G', true, 30, 13, 2, 8, 6, 5, 11, 3, 6, 0, 0, 2, 3],
  ['E. Tanaka', 'F', true, 27, 9, 5, 1, 4, 3, 8, 1, 4, 2, 2, 1, 1],
  ['G. Silva', 'G', false, 21, 14, 2, 3, 7, 5, 9, 3, 5, 1, 1, 1, 1],
  ['H. Osei', 'C', false, 18, 8, 6, 0, 2, 3, 5, 0, 0, 2, 2, 0, 0],
  ['V. Petrov', 'F', false, 15, 5, 2, 1, 3, 2, 4, 1, 2, 0, 0, 0, 1],
];
const toLine = (team: 'home' | 'away') => (r: BoxRow) => ({
  name: r[0], team, position: r[1], starter: r[2], minutes: r[3], points: r[4], rebounds: r[5], assists: r[6],
  plus_minus: r[7], fgm: r[8], fga: r[9], tpm: r[10], tpa: r[11], ftm: r[12], fta: r[13], steals: r[14], blocks: 0, fouls: 2, turnovers: r[15],
});
export const nbaScenarioBox = [...H.map(toLine('home')), ...A.map(toLine('away'))];
