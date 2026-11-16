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

export type Match = {
  fixture_id: number;
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
