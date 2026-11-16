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
    { quarter: 3, label: '3. Çeyrek', home_pts: 22, away_pts: 34, swing: -12, score_after: '77-89', title: 'Vipers\'ın 12 sayılık serisi', description: 'Devre arasında 55-55 olan skor, boyalı alan atakları ve top kayıplarından gelen sayılarla 12 farka açıldı.', momentum: 'away' },
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
  player_performance_spotlight: {
    player: 'Marcus Vale',
    team: 'away',
    position: 'Forvet',
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
