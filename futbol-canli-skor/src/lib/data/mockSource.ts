import { isFinished, type Match, type MatchEvent, type TacticalPayload } from '../types';
import {
  buildFallbackPayload,
  initialMatches,
  lombardiaPayload,
  SCENARIO_FIXTURE_ID,
  scenarioPayload,
} from './mockData';
import type { DataSource } from './types';

/**
 * Önizleme modu: Supabase Realtime + RPC davranışını bellekte taklit eder.
 * - Canlı maçlarda dakika her TICK_MS'de bir ilerler, ara sıra gol olur.
 * - request_match_analysis singleflight mantığı birebir uygulanır.
 */
const TICK_MS = 4000;
const GENERATION_MS = 6500;

export function createMockSource(): DataSource {
  const matches = new Map<number, Match>(initialMatches.map((m) => [m.fixture_id, structuredClone(m)]));
  const analyses = new Map<number, TacticalPayload>([[9004, lombardiaPayload]]);
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

  const tick = () => {
    for (const m of matches.values()) {
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

  return {
    async listMatches() {
      return [...matches.values()].map((m) => ({ ...m }));
    },
    async getMatch(id) {
      const m = matches.get(id);
      return m ? { ...m } : null;
    },
    subscribeMatches: (cb) => subscribe(() => true, cb),
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
        analyses.set(id, id === SCENARIO_FIXTURE_ID ? scenarioPayload : buildFallbackPayload(matches.get(id)!));
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
