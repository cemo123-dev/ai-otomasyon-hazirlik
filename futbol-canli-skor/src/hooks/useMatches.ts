import { useCallback, useEffect, useMemo, useState } from 'react';
import { dataSource } from '@/lib/data';
import { isFinished, isLive, type Match } from '@/lib/types';

export type MatchFilter = 'all' | 'live' | 'finished';

export type LeagueGroup = {
  key: string;
  league_name: string;
  league_country: string | null;
  priority: number;
  data: Match[];
};

const stateRank = (m: Match) => (isLive(m.status_short) ? 0 : isFinished(m.status_short) ? 1 : 2);

export function useMatches(filter: MatchFilter) {
  const [matches, setMatches] = useState<Map<number, Match>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const list = await dataSource.listMatches();
      setMatches(new Map(list.map((m) => [m.fixture_id, m])));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Maçlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    // Realtime: skor / dakika / analiz durumu değişiklikleri tek tek uygulanır
    return dataSource.subscribeMatches((m) =>
      setMatches((prev) => {
        const next = new Map(prev);
        next.set(m.fixture_id, { ...prev.get(m.fixture_id), ...m });
        return next;
      }),
    );
  }, [load]);

  const groups = useMemo<LeagueGroup[]>(() => {
    const byLeague = new Map<string, LeagueGroup>();
    for (const m of matches.values()) {
      if (filter === 'live' && !isLive(m.status_short)) continue;
      if (filter === 'finished' && !isFinished(m.status_short)) continue;
      const key = `${m.league_country ?? ''}|${m.league_name}`;
      let g = byLeague.get(key);
      if (!g) {
        g = { key, league_name: m.league_name, league_country: m.league_country, priority: m.league_priority, data: [] };
        byLeague.set(key, g);
      }
      g.data.push(m);
    }
    const out = [...byLeague.values()].sort((a, b) => a.priority - b.priority);
    for (const g of out) {
      g.data.sort((a, b) => stateRank(a) - stateRank(b) || a.kickoff_at.localeCompare(b.kickoff_at));
    }
    return out;
  }, [matches, filter]);

  const liveCount = useMemo(() => [...matches.values()].filter((m) => isLive(m.status_short)).length, [matches]);

  return { groups, liveCount, loading, error, reload: load };
}
