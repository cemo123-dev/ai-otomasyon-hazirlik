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
  /** Maç öncesi AI (bkz. 0005_prematch.sql) */
  preview_status?: AnalysisStatus;
  lineups?: PreviewPayload['lineups'] | null;
  /** Canlı devre arası raporu (bkz. 0006_halftime.sql) */
  halftime_status?: AnalysisStatus;
  /** Ücretsiz tek cümle (push metniyle aynı) */
  halftime_teaser?: string | null;
  /** Takım kimliği ve logo (bkz. 0010_teams.sql) */
  home_team_id?: number | null;
  away_team_id?: number | null;
  home_logo?: string | null;
  away_logo?: string | null;
  /** Tam kadro ve maç sonu oyuncu puanları (bkz. 0013_lineups_freshness.sql) — yalnız maç ekranında çekilir */
  lineup_detail?: LineupDetail | null;
  /** NBA: biten maçta tüm oyuncuların istatistikleri (bkz. 0014_nba_box.sql) */
  box_score?: NbaBoxLine[] | null;
  player_ratings?: PlayerRating[] | null;
  /** Veri kaynağının bu maç için son kontrol edildiği an ("Son güncelleme HH:MM") */
  updated_at?: string | null;
};

/** Kadro oyuncusu. grid: "satır:sütun" (1 = kaleci hattı); pos: G / D / M / F */
export type LineupPlayer = { id: number | null; name: string; number: number | null; pos: string | null; grid: string | null };

export type TeamLineupDetail = {
  team_id: number | null;
  formation: string | null;
  coach: string | null;
  start_xi: LineupPlayer[];
  substitutes: LineupPlayer[];
};

/** matches.lineup_detail — maç önü AI'nın matches.lineups formatından ayrı kolon */
export type LineupDetail = { home: TeamLineupDetail | null; away: TeamLineupDetail | null };

/** matches.player_ratings — puana göre azalan */
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
  /** 0015: istatistik henüz yok (deneme sayılmaz) */
  | 'not_ready'
  | 'generating'
  | 'completed'
  | 'not_finished'
  | 'not_found'
  | 'failed'
  | 'unauthenticated';

export type SubscriptionPlan = 'monthly' | 'yearly';

// Durum kodları saf modülde (Deno testleri); SUSP sunucuyla tutarlı olarak canlı sayılır
export { FINISHED_STATUSES, isFinished, isLive, isOff, LIVE_STATUSES, liveLabel, offLabel, statusSpeech } from './status';

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
  player_impact?: NbaPlayerImpact | null;
};

/** Hollinger Game Score'un hücum/savunma bileşenine göre öne çıkan oyuncu */
export type PlayerImpact = { name: string; team: Side; starter: boolean; minutes: number; score: number; line: string };

export type FoulTrouble = {
  name: string;
  team: Side;
  starter: boolean;
  fouls: number;
  fouled_out: boolean;
  minutes: number;
  points: number;
  plus_minus: number;
};

/** NBA box score satırı (sunucudaki NbaPlayerLine ile aynı) */
export type NbaBoxLine = {
  name: string;
  team: 'home' | 'away';
  starter: boolean;
  position: string;
  minutes: number;
  points: number;
  rebounds: number;
  assists: number;
  plus_minus: number;
  fgm: number;
  fga: number;
  tpm: number;
  tpa: number;
  ftm?: number;
  fta: number;
  off_reb?: number;
  def_reb?: number;
  steals?: number;
  blocks?: number;
  fouls?: number;
  turnovers?: number;
};

export type NbaPlayerImpact = { offense: PlayerImpact[]; defense: PlayerImpact[]; foul_trouble: FoulTrouble[] };

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
  /** Eski analizlerde yok: kart yalnızca varsa gösterilir */
  player_impact?: (NbaPlayerImpact & { commentary: string; foul_commentary: string }) | null;
  player_performance_spotlight: TacticalPayload['player_performance_spotlight'];
};

/** match_analyses.tactical_payload: futbol veya NBA */
export type AnyTacticalPayload = TacticalPayload | NbaTacticalPayload;

export const isNbaPayload = (p: AnyTacticalPayload): p is NbaTacticalPayload => (p as NbaTacticalPayload).sport === 'nba';

/** NBA satırlarında stats kolonu NbaStats tutar */
export const getNbaStats = (m: Match): NbaStats | null =>
  m.sport_type === 'nba' && m.stats ? (m.stats as unknown as NbaStats) : null;

// ═══════════════════════════════════════════════ MAÇ ÖNCESİ AI
// Sunucudaki supabase/functions/_shared/preview.ts ile aynı sözleşme

export type PlayerForm = {
  player_id: number;
  name: string;
  matches: number;
  minutes: number;
  duel_pct: number | null;
  dribble_pct: number | null;
  dribbles_90: number;
  tkl_int_90: number;
  dribbled_past_90: number;
  key_passes_90: number;
  rating: number | null;
};

export type TeamForm = {
  n: number;
  xg_for: number | null;
  xg_against: number | null;
  shots: number | null;
  possession: number | null;
  results: string;
  trend: { recent: number; earlier: number; dir: 'up' | 'down' | 'flat' } | null;
};

export type PreviewMatchup = {
  zone: 'sol kanat' | 'sağ kanat';
  attacking_side: 'home' | 'away';
  attacker: { name: string; pos: string; form: PlayerForm | null };
  defender: { name: string; pos: string; form: PlayerForm | null };
  edge: number | null;
};

export type PreviewAbsence = { side: 'home' | 'away'; name: string; reason: string; regular_starter: boolean };

export type PreviewPayload = {
  kind: 'preview';
  headline: string;
  overview: string;
  lineups: Record<'home' | 'away', { formation: string; coach: string | null; xi: { name: string; pos: string }[] }>;
  form: Record<'home' | 'away', TeamForm>;
  matchups: PreviewMatchup[];
  key_matchup_index: number | null;
  key_matchup_commentary: string;
  breaking_scenario: string;
  watch_list: string[];
  absences: PreviewAbsence[];
  absences_commentary: string;
  data_basis: 'api_last5' | 'db_history' | 'mixed' | 'lineups_only';
  generated_at: string;
};

export type PreviewRequestResult =
  | 'unauthenticated'
  | 'not_found'
  | 'not_supported'
  | 'not_prematch'
  | 'too_early'
  | 'paywall_blocked'
  /** 0015: ilk 11 son 5 dk içinde denendi, henüz açıklanmadı */
  | 'not_ready'
  | 'completed'
  | 'generating'
  | 'failed';

// ═══════════════════════════════════════════════ DEVRE ARASI "SOYUNMA ODASI REÇETESİ"
// Sunucudaki supabase/functions/_shared/halftime.ts ile aynı sözleşme

export type HalfStats = {
  possession: number | null;
  xg: number | null;
  shots: number;
  on_target: number;
  inside_box: number;
  outside_box: number;
  corners: number;
  fouls: number;
  pass_pct: number | null;
};

export type HalftimeSignal =
  | { kind: 'red_card'; side: 'home' | 'away'; minute: number; player: string }
  | { kind: 'sterile_possession'; side: 'home' | 'away'; possession: number; xg: number }
  | { kind: 'xg_score_mismatch'; side: 'home' | 'away'; xg: number; opp_xg: number }
  | { kind: 'long_range'; side: 'home' | 'away'; outside: number; shots: number };

export type HalftimePayload = {
  kind: 'halftime';
  headline: string;
  situation: string;
  prescriptions: { side: 'home' | 'away'; move: string; why: string }[];
  key: string;
  score: { home: number; away: number };
  formations: Record<'home' | 'away', string | null>;
  first_half: Record<'home' | 'away', HalfStats>;
  events: { minute: number; side: 'home' | 'away'; type: 'goal' | 'red_card' | 'substitution'; player: string; detail?: string | null }[];
  signals: HalftimeSignal[];
  teaser: string;
  generated_at: string;
};

export type HalftimeRequestResult =
  | 'unauthenticated'
  | 'not_found'
  | 'not_supported'
  | 'not_halftime'
  | 'paywall_blocked'
  | 'completed'
  | 'generating'
  | 'failed';

// ═══════════════════════════════════════════════ AKILLI ALARM
// Sunucudaki supabase/functions/_shared/alerts.ts ile aynı sözleşme (bkz. 0007_alerts.sql)

export type AlertKind = 'pressure' | 'nba_run' | 'red_card';

export type MatchAlert = {
  id: number;
  fixture_id: number;
  kind: AlertKind;
  side: 'home' | 'away' | null;
  /** Futbol: dakika, NBA: çeyrek */
  minute: number | null;
  title: string;
  body: string;
  /** Kırmızı kartta canlı taktik analizin durumu */
  analysis_status: AnalysisStatus;
  created_at: string;
};

export type RedCardAnalysis = {
  kind: 'red_card';
  headline: string;
  situation: string;
  prescriptions: { side: 'home' | 'away'; move: string; why: string }[];
  key: string;
  red: { side: 'home' | 'away'; player: string; minute: number };
  minute: number;
  score: { home: number; away: number };
  generated_at: string;
};

/** Bildirim türleri (notification_prefs). Satır yoksa hepsi açık. */
export type NotificationPrefs = { kickoff: boolean; halftime: boolean; pressure: boolean; nba_run: boolean; red_card: boolean };

export const DEFAULT_PREFS: NotificationPrefs = { kickoff: true, halftime: true, pressure: true, nba_run: true, red_card: true };

/** Takip edilen takım (bkz. 0010_teams.sql) */
export type FollowedTeam = { sport_type: Sport; team_id: number; team_name: string; team_logo: string | null };

// ═══════════════════════════════════════════════ F7 AI "HATA BİLDİR" (bkz. 0020_ai_reports.sql)

/** AI çıktısının görüldüğü yüzey (sunucudaki check kısıtıyla aynı liste) */
export type AiSurface = 'analysis' | 'nba_analysis' | 'preview' | 'halftime' | 'assistant' | 'red_card';
export type AiReportReason = 'wrong_info' | 'inappropriate' | 'sport_mixup' | 'other';
/** Not alanı üst sınırı (sunucu da 200 karaktere kırpar) */
export const AI_REPORT_NOTE_MAX = 200;
export type AiReport = {
  fixtureId: number;
  surface: AiSurface;
  /** Yüzeydeki öğe: asistan yanıtının / alarmın kimliği; rapor geneli için null */
  itemRef: string | null;
  reason: AiReportReason;
  note: string | null;
};
/** ok | rate_limited (günde 20) | unavailable (0020 kurulmadı) | invalid | unauthenticated */
export type AiReportResult = 'ok' | 'rate_limited' | 'unavailable' | 'invalid' | 'unauthenticated';

// ═══════════════════════════════════════════════ TAKTİK ASİSTANA SOR (bkz. 0008_assistant.sql)

export const ASSISTANT_QUESTION_LIMIT = 3;

export type ChatMessage = {
  id: number;
  fixture_id: number;
  question: string;
  answer: string | null;
  /** failed = doğrulanamadı / hata; hakka sayılmaz */
  status: 'pending' | 'answered' | 'failed';
  created_at: string;
};

export type AskResult =
  | 'unauthenticated'
  | 'not_found'
  | 'not_ready'
  | 'paywall_blocked'
  | 'invalid'
  | 'limit_reached'
  | 'busy'
  | 'queued';
