// Uygulamadaki src/lib/types.ts ile aynı sözleşme (Edge Functions Deno'da çalıştığı için kopya).

export type MatchEvent = {
  minute: number;
  extra?: number | null;
  team: 'home' | 'away';
  type: 'goal' | 'own_goal' | 'penalty_goal' | 'red_card' | 'yellow_card' | 'substitution' | 'var';
  player: string;
  detail?: string | null;
};

export type TeamStats = {
  possession: number;
  xg: number;
  shots_total: number;
  shots_on_target: number;
  shots_inside_box: number;
  shots_outside_box: number;
  passes_accuracy: number;
  corners: number;
  fouls: number;
};

export type MatchStats = { home: TeamStats; away: TeamStats };

/** Maç sonu öne çıkan oyuncular (spotlight için; LLM'e kompakt olarak verilir) */
export type TopPlayer = {
  name: string;
  team: 'home' | 'away';
  position: string;
  rating: number;
  goals: number;
  assists: number;
  key_passes: number;
  tackles: number;
  duels_won: number;
  shots: number;
};

/** Kadro oyuncusu (0013: matches.lineup_detail). grid: "satır:sütun" (1 = kaleci hattı) */
export type LineupPlayer = { id: number | null; name: string; number: number | null; pos: string | null; grid: string | null };

export type TeamLineupDetail = {
  team_id: number | null;
  formation: string | null;
  coach: string | null;
  start_xi: LineupPlayer[];
  substitutes: LineupPlayer[];
};

/** Tam kadro; maç önü AI'nın matches.lineups formatından AYRI kolon */
export type LineupDetail = { home: TeamLineupDetail | null; away: TeamLineupDetail | null };

/** Maç sonu oyuncu puanı (0013: matches.player_ratings, puana göre azalan) */
export type PlayerRating = {
  id: number | null;
  name: string;
  team: 'home' | 'away';
  number: number | null;
  pos: string | null;
  rating: number;
  minutes: number;
  goals: number;
  assists: number;
};

export type MatchRow = {
  sport_type?: 'football' | 'nba';
  fixture_id: number;
  league_id: number | null;
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
  analysis_status: 'none' | 'generating' | 'completed' | 'failed';
  events: MatchEvent[] | null;
  stats: MatchStats | null;
  home_coach: string | null;
  away_coach: string | null;
  top_players: TopPlayer[] | null;
  /** 0010_teams.sql: takım kimliği ve logo */
  home_team_id?: number | null;
  away_team_id?: number | null;
  home_logo?: string | null;
  away_logo?: string | null;
  /** 0013_lineups_freshness.sql */
  lineup_detail?: LineupDetail | null;
  player_ratings?: PlayerRating[] | null;
  updated_at?: string;
};

export type ShotQualityVerdict = 'sterile_dominance' | 'clinical_transition' | 'balanced_exchange' | 'chance_wastage';

export type TacticalPayload = {
  headline_title: string;
  executive_tactical_verdict: string;
  xg_and_shot_quality_audit: {
    verdict_type: ShotQualityVerdict;
    verdict_label: string;
    home: { xg: number; shots: number; xg_per_shot: number; shots_on_target: number; shots_inside_box: number };
    away: { xg: number; shots: number; xg_per_shot: number; shots_on_target: number; shots_inside_box: number };
    commentary: string;
  };
  game_state_and_momentum_shifts: {
    minute: number;
    score_state: string;
    title: string;
    description: string;
    momentum: 'home' | 'away' | 'neutral';
  }[];
  managerial_and_bench_impact: {
    home: { manager: string; delta: number; key_decision: string; commentary: string };
    away: { manager: string; delta: number; key_decision: string; commentary: string };
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

export const FINISHED = ['FT', 'AET', 'PEN'];
export const LIVE = ['1H', 'HT', '2H', 'ET', 'BT', 'P', 'LIVE', 'INT', 'SUSP'];
