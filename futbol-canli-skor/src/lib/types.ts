// Supabase şemasıyla birebir eşleşen tipler (bkz. supabase/migrations/0001_init.sql)

export type AnalysisStatus = 'none' | 'generating' | 'completed' | 'failed';

export type MatchEvent = {
  minute: number;
  extra?: number | null;
  team: 'home' | 'away';
  type: 'goal' | 'own_goal' | 'penalty_goal' | 'red_card' | 'yellow_card' | 'substitution' | 'var';
  player: string;
  /** Asist yapan oyuncu veya oyuna giren oyuncu */
  detail?: string | null;
};

export type TeamStats = {
  possession: number; // %
  xg: number;
  shots_total: number;
  shots_on_target: number;
  shots_inside_box: number;
  shots_outside_box: number;
  passes_accuracy: number; // %
  corners: number;
  fouls: number;
};

export type MatchStats = { home: TeamStats; away: TeamStats };

export type Sport = 'football' | 'nba';

export type PeriodScores = { home: number[]; away: number[] };

export type Match = {
  fixture_id: number;
  sport_type: Sport;
  /** NBA: çeyrek (ve uzatma) skorları */
  period_scores: PeriodScores | null;
  /** NBA: "Q3 04:12", "Devre Arası", "Maç Sonu" */
  status_detail: string | null;
  league_name: string;
  league_country: string | null;
  league_priority: number;
  kickoff_at: string;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  status_short: string;
  elapsed_minute: number | null;
  summary_teaser: string | null;
  analysis_status: AnalysisStatus;
  events: MatchEvent[] | null;
  /** Futbol: MatchStats. NBA satırlarında aynı kolon NbaStats tutar (bkz. getNbaStats). */
  stats: MatchStats | null;
};

export type ShotQualityVerdict =
  | 'sterile_dominance'
  | 'clinical_transition'
  | 'balanced_exchange'
  | 'chance_wastage';

export type TeamShotAudit = {
  xg: number;
  shots: number;
  xg_per_shot: number;
  shots_on_target: number;
  shots_inside_box: number;
};

export type MomentumShift = {
  minute: number;
  score_state: string;
  title: string;
  description: string;
  momentum: 'home' | 'away' | 'neutral';
};

export type ManagerImpact = {
  manager: string;
  delta: number; // -3 … +3 arası etki puanı
  key_decision: string;
  commentary: string;
};

export type TacticalPayload = {
  headline_title: string;
  executive_tactical_verdict: string;
  xg_and_shot_quality_audit: {
    verdict_type: ShotQualityVerdict;
    verdict_label: string;
    home: TeamShotAudit;
    away: TeamShotAudit;
    commentary: string;
  };
  game_state_and_momentum_shifts: MomentumShift[];
  managerial_and_bench_impact: {
    home: ManagerImpact;
    away: ManagerImpact;
  };
  player_performance_spotlight: {
    player: string;
    team: 'home' | 'away';
    position: string;
    rating: number;
    headline: string;
    key_stats: { label: string; value: string }[];
  };
};

export type AnalysisRequestResult =
  | 'paywall_blocked'
  | 'generating'
  | 'completed'
  | 'not_finished'
  | 'not_found'
  | 'failed'
  | 'unauthenticated';

export type SubscriptionPlan = 'monthly' | 'yearly';

export const LIVE_STATUSES = ['1H', 'HT', '2H', 'ET', 'BT', 'P', 'LIVE', 'INT'] as const;
export const FINISHED_STATUSES = ['FT', 'AET', 'PEN'] as const;

export const isLive = (s: string) => (LIVE_STATUSES as readonly string[]).includes(s);
export const isFinished = (s: string) => (FINISHED_STATUSES as readonly string[]).includes(s);

// ═══════════════════════════════════════════════ NBA
// Sunucudaki supabase/functions/_shared/nbaMetrics.ts + nbaAnalysis.ts ile aynı sözleşme

export type NbaTeamBox = {
  points: number;
  fgm: number;
  fga: number;
  ftm: number;
  fta: number;
  tpm: number;
  tpa: number;
  off_reb: number;
  def_reb: number;
  tot_reb: number;
  assists: number;
  turnovers: number;
  steals: number;
  blocks: number;
  fouls: number;
  points_in_paint: number | null;
  points_off_turnovers: number | null;
  second_chance_points: number | null;
  fast_break_points: number | null;
};

type Side = 'home' | 'away';

export type NbaMetrics = {
  ts: { home: number; away: number; diff: number };
  shooting: Record<Side, { fg_pct: number; tp_pct: number; fga: number; tpa: number; three_rate: number }>;
  volume_trap: { team: Side; extra_fga: number; extra_tpa: number; ts_gap: number } | null;
  quarters: {
    quarter: number;
    label: string;
    home_pts: number;
    away_pts: number;
    swing: number;
    score_after: string;
    leader_after: Side | 'tie';
  }[];
  decisive: { quarter: number; label: string; team: Side; margin: number; kind: 'break' | 'comeback' | 'hold'; text: string } | null;
  possession: {
    off_reb: Record<Side, number>;
    turnovers: Record<Side, number>;
    extra_possessions_home: number;
    points_in_paint: Record<Side, number> | null;
    points_off_turnovers: Record<Side, number> | null;
    second_chance_points: Record<Side, number> | null;
  };
  bench: Record<Side, { starters_pm_avg: number; bench_pm_avg: number; starters_points: number; bench_points: number }> & {
    bench_points_diff_home: number;
  };
  late_game: { q4_home: number | null; q4_away: number | null; final_margin: number; close_game: boolean };
  winner: Side | 'tie';
};

export type NbaStats = { home: NbaTeamBox; away: NbaTeamBox; metrics: NbaMetrics };

export type NbaEfficiencyVerdict = 'inefficient_volume' | 'efficient_offense' | 'balanced' | 'defensive_grind';

export type NbaTacticalPayload = {
  sport: 'nba';
  headline_title: string;
  executive_tactical_verdict: string;
  efficiency_audit: {
    verdict_type: NbaEfficiencyVerdict;
    verdict_label: string;
    home: { ts_pct: number; fg_pct: number; tp_pct: number; fga: number; tpa: number; points: number };
    away: { ts_pct: number; fg_pct: number; tp_pct: number; fga: number; tpa: number; points: number };
    volume_trap_team: Side | null;
    commentary: string;
  };
  quarter_runs: {
    quarter: number;
    label: string;
    home_pts: number;
    away_pts: number;
    swing: number;
    score_after: string;
    title: string;
    description: string;
    momentum: Side | 'neutral';
  }[];
  late_game: { close_game: boolean; q4_home: number | null; q4_away: number | null; final_margin: number; commentary: string };
  bench_impact: Record<Side, { starters_pm_avg: number; bench_pm_avg: number; bench_points: number; commentary: string }>;
  possession_battle: NbaMetrics['possession'];
  player_performance_spotlight: TacticalPayload['player_performance_spotlight'];
};

/** match_analyses.tactical_payload: futbol veya NBA */
export type AnyTacticalPayload = TacticalPayload | NbaTacticalPayload;

export const isNbaPayload = (p: AnyTacticalPayload): p is NbaTacticalPayload => (p as NbaTacticalPayload).sport === 'nba';

/** NBA satırlarında stats kolonu NbaStats tutar */
export const getNbaStats = (m: Match): NbaStats | null =>
  m.sport_type === 'nba' && m.stats ? (m.stats as unknown as NbaStats) : null;
