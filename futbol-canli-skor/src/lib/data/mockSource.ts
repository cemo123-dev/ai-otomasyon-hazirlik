import { isFinished, type AnyTacticalPayload, type Match, type MatchEvent } from '../types';
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

const allMatches: Match[] = [
  ...initialMatches.map((m) => ({ ...m, sport_type: 'football' as const, period_scores: null, status_detail: null })),
  ...nbaMatches,
];

/** "Q3 04:12" → { period: 3, seconds: 252 } */
const parseClock = (detail: string | null) => {
  const m = detail?.match(/^Q(\d)\s+(\d{1,2}):(\d{2})/);
  return m ? { period: Number(m[1]), seconds: Number(m[2]) * 60 + Number(m[3]) } : null;
};
const fmtClock = (period: number, seconds: number) =>
  `Q${period} ${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

export function createMockSource(): DataSource {
  const matches = new Map<number, Match>(allMatches.map((m) => [m.fixture_id, structuredClone(m)]));
  const analyses = new Map<number, AnyTacticalPayload>([[9004, lombardiaPayload]]);
  const listeners = new Set<(m: Match) => void>();
  let premium = false;
  let timer: ReturnType<typeof setInterval> | null = null;
  const htTicks = new Map<number, number>();

  const emit = (m: Match) => listeners.forEach((l) => l({ ...m }));

  const update = (id: number, patch: Partial<Match>) => {
    const cur = matches.get(id);
    if (!cur) return;
    const next = { ...cur, ...patch };
    matches.set(id, next);
    emit(next);
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
        if (t >= 3) update(m.fixture_id, { status_short: '2H', elapsed_minute: 46 });
        continue;
      }
      if (m.status_short !== '1H' && m.status_short !== '2H') continue;
      const minute = (m.elapsed_minute ?? 0) + 1;
      if (m.status_short === '1H' && minute > 45) {
        update(m.fixture_id, { status_short: 'HT', elapsed_minute: 45 });
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

    async getPremium() {
      return premium;
    },

    async simulateSubscription(plan) {
      premium = plan !== null;
      return premium;
    },
  };
}
