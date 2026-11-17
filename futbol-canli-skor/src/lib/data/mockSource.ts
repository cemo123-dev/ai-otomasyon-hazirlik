import {
  ASSISTANT_QUESTION_LIMIT,
  DEFAULT_PREFS,
  isFinished,
  type AnyTacticalPayload,
  type HalftimePayload,
  type Match,
  type ChatMessage,
  type FollowedTeam,
  type MatchAlert,
  type MatchEvent,
  type NotificationPrefs,
  type PreviewPayload,
} from '../types';
import { mockAnswer } from './assistantMockData';
import { LIVE_PRESSURE_MINUTE, livePressureAlert, redCardAnalysisMock, seedAlerts, TURKEY_SCOTLAND_ID } from './alertsMockData';
import { buildMockHalftime } from './halftimeMockData';
import { clampToToday, dayStripMatches, mockLineups } from './lineupMockData';
import { PREVIEW_MOCK_ID, previewMockPayload } from './previewMockData';
import {
  buildFallbackPayload,
  initialMatches,
  lombardiaPayload,
  SCENARIO_FIXTURE_ID,
  scenarioPayload,
} from './mockData';
import { NBA_SCENARIO_ID, nbaMatches, nbaScenarioPayload } from './nbaMockData';
import type { DataSource } from './types';

/**
 * Önizleme modu: Supabase Realtime + RPC davranışını bellekte taklit eder.
 * - Canlı futbol maçlarında dakika, canlı NBA maçlarında çeyrek saati ilerler; ara sıra skor olur.
 * - request_match_analysis singleflight mantığı birebir uygulanır.
 */
const TICK_MS = 4000;
const GENERATION_MS = 6500;
const NBA_TICK_SECONDS = 37;

/** Önizleme: takım kimliği isimden türetilir (gerçek sistemde API kimliği) */
const teamId = (name: string) => [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % 1_000_000;
const withTeamIds = (m: Match): Match => ({ ...m, home_team_id: teamId(m.home_team), away_team_id: teamId(m.away_team), home_logo: null, away_logo: null });

/** Veri tazeliği taklidi: ilk açılışta "birkaç dakika önce kontrol edildi" */
const SYNCED_AGO_MS = 7 * 60_000;

const buildMatches = (): Match[] =>
  [
    ...initialMatches.map((m) => ({
      ...m,
      sport_type: 'football' as const,
      period_scores: null,
      status_detail: null,
      preview_status: 'none' as const,
      halftime_status: 'none' as const,
      halftime_teaser: null,
      ...mockLineups[m.fixture_id],
    })),
    ...nbaMatches,
  ]
    // Tarih şeridi: göreli saatli örnek maçlar her saatte "Bugün"de kalır
    .map((m) => ({ ...m, kickoff_at: clampToToday(m.kickoff_at) }))
    .concat(dayStripMatches())
    .map((m) => ({ ...withTeamIds(m), updated_at: new Date(Date.now() - SYNCED_AGO_MS).toISOString() }));

/** "Q3 04:12" → { period: 3, seconds: 252 } */
const parseClock = (detail: string | null) => {
  const m = detail?.match(/^Q(\d)\s+(\d{1,2}):(\d{2})/);
  return m ? { period: Number(m[1]), seconds: Number(m[2]) * 60 + Number(m[3]) } : null;
};
const fmtClock = (period: number, seconds: number) =>
  `Q${period} ${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

export function createMockSource(): DataSource {
  const matches = new Map<number, Match>(buildMatches().map((m) => [m.fixture_id, structuredClone(m)]));
  const analyses = new Map<number, AnyTacticalPayload>([[9004, lombardiaPayload]]);
  const previews = new Map<number, PreviewPayload>();
  const halftimes = new Map<number, HalftimePayload>();
  const follows = new Set<number>();
  const teamFollows = new Map<string, FollowedTeam>();
  const alerts: MatchAlert[] = seedAlerts.map((a) => ({ ...a }));
  const alertListeners = new Set<(a: MatchAlert) => void>();
  let prefs: NotificationPrefs = { ...DEFAULT_PREFS };
  const chat: ChatMessage[] = [];
  const chatListeners = new Set<(m: ChatMessage) => void>();
  const listeners = new Set<(m: Match) => void>();
  let premium = false;
  let timer: ReturnType<typeof setInterval> | null = null;
  const htTicks = new Map<number, number>();

  const emit = (m: Match) => listeners.forEach((l) => l({ ...m }));

  const update = (id: number, patch: Partial<Match>) => {
    const cur = matches.get(id);
    if (!cur) return;
    // Skor/dakika değişimi = kaynak kontrol edildi (0013 tetikleyicisinin taklidi); AI durum alanları tazelik sayılmaz
    const synced = ['home_score', 'away_score', 'status_short', 'elapsed_minute', 'status_detail', 'events', 'stats'].some(
      (k) => k in patch,
    );
    const next = { ...cur, ...patch, ...(synced ? { updated_at: new Date().toISOString() } : {}) };
    matches.set(id, next);
    emit(next);
  };

  /** Devre arası raporu (singleflight taklidi); gerçek sistemde takipçilere push da gider */
  const startHalftime = (id: number) => {
    const m = matches.get(id);
    if (!m || m.sport_type !== 'football' || m.halftime_status === 'generating' || m.halftime_status === 'completed') return;
    update(id, { halftime_status: 'generating' });
    setTimeout(() => {
      const report = buildMockHalftime(matches.get(id)!);
      halftimes.set(id, report);
      update(id, { halftime_status: 'completed', halftime_teaser: report.teaser });
    }, GENERATION_MS);
  };

  const tickNba = (m: Match) => {
    const c = parseClock(m.status_detail);
    if (!c || !m.period_scores) return;
    const ps = structuredClone(m.period_scores);
    const patch: Partial<Match> = {};
    // Her adımda iki tarafa da olası sayı
    for (const side of ['home', 'away'] as const) {
      if (Math.random() < 0.55) {
        const pts = Math.random() < 0.35 ? 3 : 2;
        ps[side][c.period - 1] = (ps[side][c.period - 1] ?? 0) + pts;
        patch[side === 'home' ? 'home_score' : 'away_score'] = (m[side === 'home' ? 'home_score' : 'away_score'] ?? 0) + pts;
      }
    }
    patch.period_scores = ps;
    const left = c.seconds - NBA_TICK_SECONDS;
    if (left > 0) {
      patch.status_detail = fmtClock(c.period, left);
    } else if (c.period < 4) {
      ps.home.push(0);
      ps.away.push(0);
      patch.elapsed_minute = c.period + 1;
      patch.status_detail = fmtClock(c.period + 1, 12 * 60);
    } else {
      const h = patch.home_score ?? m.home_score;
      const a = patch.away_score ?? m.away_score;
      Object.assign(patch, {
        status_short: 'FT',
        status_detail: 'Maç Sonu',
        summary_teaser: `${m.home_team} ${h}-${a} ${m.away_team}. (Önizleme: canlı simülasyon sona erdi.)`,
      });
    }
    update(m.fixture_id, patch);
  };

  const tick = () => {
    for (const m of matches.values()) {
      if (m.sport_type === 'nba') {
        if (m.status_short === 'LIVE') tickNba(m);
        continue;
      }
      if (m.status_short === 'HT') {
        const t = (htTicks.get(m.fixture_id) ?? 0) + 1;
        htTicks.set(m.fixture_id, t);
        // Devre arası önizlemede ~40 sn sürer (raporu görecek kadar)
        if (t >= 10) update(m.fixture_id, { status_short: '2H', elapsed_minute: 46 });
        continue;
      }
      if (m.status_short !== '1H' && m.status_short !== '2H') continue;
      const minute = (m.elapsed_minute ?? 0) + 1;
      if (m.status_short === '1H' && minute > 45) {
        update(m.fixture_id, { status_short: 'HT', elapsed_minute: 45 });
        startHalftime(m.fixture_id); // sync-matches'teki otomatik HT tespitinin taklidi
        continue;
      }
      if (m.status_short === '2H' && minute > 90) {
        update(m.fixture_id, {
          status_short: 'FT',
          elapsed_minute: 90,
          summary_teaser: `${m.home_team} ${m.home_score}-${m.away_score} ${m.away_team}. xG: ${m.stats?.home.xg.toFixed(2)} - ${m.stats?.away.xg.toFixed(2)}.`,
        });
        continue;
      }
      const patch: Partial<Match> = { elapsed_minute: minute };
      // sync-matches'teki baskı alarmı tespitinin taklidi (Realtime ile maç ekranına düşer)
      if (m.fixture_id === TURKEY_SCOTLAND_ID && minute === LIVE_PRESSURE_MINUTE && !alerts.some((a) => a.kind === 'pressure')) {
        const a = livePressureAlert(Math.max(0, ...alerts.map((x) => x.id)) + 1);
        alerts.unshift(a);
        alertListeners.forEach((l) => l({ ...a }));
      }
      if (Math.random() < 0.06) {
        const side: 'home' | 'away' = Math.random() < 0.5 ? 'home' : 'away';
        const ev: MatchEvent = { minute, team: side, type: 'goal', player: side === 'home' ? 'Ev Sahibi Forvet' : 'Deplasman Forvet' };
        patch.events = [...(m.events ?? []), ev];
        if (side === 'home') patch.home_score = (m.home_score ?? 0) + 1;
        else patch.away_score = (m.away_score ?? 0) + 1;
        if (m.stats) {
          const s = structuredClone(m.stats);
          s[side].xg = +(s[side].xg + 0.35).toFixed(2);
          s[side].shots_total += 1;
          s[side].shots_on_target += 1;
          s[side].shots_inside_box += 1;
          patch.stats = s;
        }
      }
      update(m.fixture_id, patch);
    }
  };

  const ensureTicking = () => {
    if (!timer) timer = setInterval(tick, TICK_MS);
  };
  const maybeStop = () => {
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };

  const subscribe = (filter: (m: Match) => boolean, onChange: (m: Match) => void) => {
    const l = (m: Match) => filter(m) && onChange(m);
    listeners.add(l);
    ensureTicking();
    return () => {
      listeners.delete(l);
      maybeStop();
    };
  };

  const payloadFor = (id: number): AnyTacticalPayload => {
    if (id === SCENARIO_FIXTURE_ID) return scenarioPayload;
    if (id === NBA_SCENARIO_ID) return nbaScenarioPayload;
    const m = matches.get(id)!;
    // Simülasyonda biten NBA maçının istatistiği yok; senaryo raporu örnek olarak kullanılır
    return m.sport_type === 'nba' ? nbaScenarioPayload : buildFallbackPayload(m);
  };

  return {
    async listMatches(sport) {
      return [...matches.values()].filter((m) => m.sport_type === sport).map((m) => ({ ...m }));
    },
    async getMatch(id) {
      const m = matches.get(id);
      return m ? { ...m } : null;
    },
    subscribeMatches: (sport, cb) => subscribe((m) => m.sport_type === sport, cb),
    subscribeMatch: (id, cb) => subscribe((m) => m.fixture_id === id, cb),

    async requestAnalysis(id) {
      const m = matches.get(id);
      if (!m) return 'not_found';
      if (!isFinished(m.status_short)) return 'not_finished';
      if (!premium) return 'paywall_blocked';
      if (m.analysis_status === 'completed') return 'completed';
      if (m.analysis_status === 'generating') return 'generating'; // singleflight: ikinci üretim başlamaz
      update(id, { analysis_status: 'generating' });
      setTimeout(() => {
        analyses.set(id, payloadFor(id));
        update(id, { analysis_status: 'completed' });
      }, GENERATION_MS);
      return 'generating';
    },

    async getAnalysis(id) {
      if (!premium) return null; // RLS taklidi
      return analyses.get(id) ?? null;
    },

    // Maç öncesi AI: request_match_preview kurallarının taklidi (≤45 dk, singleflight)
    async requestPreview(id) {
      const m = matches.get(id);
      if (!m) return 'not_found';
      if (m.sport_type !== 'football') return 'not_supported';
      if (m.preview_status === 'completed') return premium ? 'completed' : 'paywall_blocked';
      if (m.status_short !== 'NS') return 'not_prematch';
      if (new Date(m.kickoff_at).getTime() > Date.now() + 45 * 60_000) return 'too_early';
      if (!premium) return 'paywall_blocked';
      if (m.preview_status === 'generating') return 'generating';
      update(id, { preview_status: 'generating' });
      setTimeout(() => {
        // Örnek rapor yalnızca senaryo maçı için hazır; diğerlerinde aynı yapı gösterilir
        previews.set(id, id === PREVIEW_MOCK_ID ? previewMockPayload : { ...previewMockPayload, headline: `${m.home_team} - ${m.away_team}: Taktik Eşleşme` });
        update(id, { preview_status: 'completed', lineups: previewMockPayload.lineups });
      }, GENERATION_MS);
      return 'generating';
    },

    async getPreview(id) {
      if (!premium) return null; // RLS taklidi
      return previews.get(id) ?? null;
    },

    // request_halftime_report kurallarının taklidi
    async requestHalftime(id) {
      const m = matches.get(id);
      if (!m) return 'not_found';
      if (m.sport_type !== 'football') return 'not_supported';
      if (m.halftime_status === 'completed' || m.halftime_status === 'generating') {
        return premium ? (m.halftime_status as 'completed' | 'generating') : 'paywall_blocked';
      }
      if (m.status_short !== 'HT') return 'not_halftime';
      if (!premium) return 'paywall_blocked';
      startHalftime(id);
      return 'generating';
    },

    async getHalftime(id) {
      if (!premium) return null; // RLS taklidi
      return halftimes.get(id) ?? null;
    },

    async toggleFollow(id) {
      if (follows.has(id)) follows.delete(id);
      else follows.add(id);
      return follows.has(id);
    },

    async listFollowedIds() {
      return [...follows];
    },

    // toggle_team_follow taklidi: takip edilince takımın başlamamış maçları da takibe alınır
    async toggleTeamFollow(t) {
      const key = `${t.sport_type}:${t.team_id}`;
      if (teamFollows.delete(key)) return false;
      teamFollows.set(key, { ...t });
      for (const m of matches.values()) {
        if (m.sport_type === t.sport_type && m.status_short === 'NS' && (m.home_team_id === t.team_id || m.away_team_id === t.team_id)) {
          follows.add(m.fixture_id);
        }
      }
      return true;
    },

    async listFollowedTeams() {
      return [...teamFollows.values()];
    },

    async registerPushToken() {
      // Önizlemede push yok
    },

    async listAlerts(id) {
      return alerts.filter((a) => a.fixture_id === id).map((a) => ({ ...a }));
    },

    subscribeAlerts(id, onAlert) {
      const l = (a: MatchAlert) => a.fixture_id === id && onAlert(a);
      alertListeners.add(l);
      // Alarm akışı maç simülasyonuyla ilerler
      const unsub = subscribe((m) => m.fixture_id === id, () => {});
      return () => {
        alertListeners.delete(l);
        unsub();
      };
    },

    async getAlertAnalysis(alertId) {
      if (!premium) return null; // RLS taklidi
      const a = alerts.find((x) => x.id === alertId);
      return a?.kind === 'red_card' && a.analysis_status === 'completed' ? redCardAnalysisMock : null;
    },

    async listChat(id) {
      return chat.filter((c) => c.fixture_id === id).map((c) => ({ ...c }));
    },

    // ask_assistant RPC kurallarının taklidi; yanıt ~1,2 sn sonra "Realtime" ile gelir
    async askAssistant(id, question) {
      const m = matches.get(id);
      if (!m) return 'not_found';
      if (m.analysis_status !== 'completed') return 'not_ready';
      if (!premium) return 'paywall_blocked';
      const q = question.trim();
      if (q.length < 3 || q.length > 200) return 'invalid';
      const mine = chat.filter((c) => c.fixture_id === id);
      if (mine.some((c) => c.status === 'pending')) return 'busy';
      if (mine.filter((c) => c.status !== 'failed').length >= ASSISTANT_QUESTION_LIMIT) return 'limit_reached';
      const msg: ChatMessage = { id: chat.length + 1, fixture_id: id, question: q, answer: null, status: 'pending', created_at: new Date().toISOString() };
      chat.push(msg);
      chatListeners.forEach((l) => l({ ...msg }));
      setTimeout(() => {
        Object.assign(msg, { status: 'answered', answer: mockAnswer(matches.get(id)!, q) });
        chatListeners.forEach((l) => l({ ...msg }));
      }, 1200);
      return 'queued';
    },

    subscribeChat(id, onMessage) {
      const l = (m: ChatMessage) => m.fixture_id === id && onMessage(m);
      chatListeners.add(l);
      return () => {
        chatListeners.delete(l);
      };
    },

    async isTestUser() {
      return true; // önizlemede test aboneliği açık
    },

    async getAccountId() {
      return '00000000-0000-0000-0000-000000000000';
    },

    async deleteAccount() {
      premium = false;
      follows.clear();
      teamFollows.clear();
      chat.length = 0;
      prefs = { ...DEFAULT_PREFS };
    },

    async getNotificationPrefs() {
      return { ...prefs };
    },

    async setNotificationPrefs(p) {
      prefs = { ...p };
    },

    async getPremium() {
      return premium;
    },

    async simulateSubscription(plan) {
      premium = plan !== null;
      return premium;
    },
  };
}
