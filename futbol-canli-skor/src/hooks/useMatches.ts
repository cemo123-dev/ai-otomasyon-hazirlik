import { useCallback, useEffect, useMemo, useState } from 'react';
import { dataSource } from '@/lib/data';
import { isFinished, isLive, type Match, type Sport } from '@/lib/types';

export type MatchFilter = 'all' | 'live' | 'finished';

export type LeagueGroup = {
  key: string;
  league_name: string;
  league_country: string | null;
  priority: number;
  data: Match[];
};

const stateRank = (m: Match) => (isLive(m.status_short) ? 0 : isFinished(m.status_short) ? 1 : 2);

export function useMatches(sport: Sport, filter: MatchFilter) {
  // Liste ve hata, yüklendikleri spora göre anahtarlanır: spor değişince eski liste
  // effect içinde temizlenmez, render sırasında türetilerek gizlenir
  const [data, setData] = useState<{ sport: Sport; map: Map<number, Match> } | null>(null);
  const [failure, setFailure] = useState<{ sport: Sport; message: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const list = await dataSource.listMatches(sport);
      setData({ sport, map: new Map(list.map((m) => [m.fixture_id, m])) });
      setFailure(null);
    } catch (e) {
      setFailure({ sport, message: (e as { message?: string } | null)?.message ?? 'Maçlar yüklenemedi' });
    }
  }, [sport]);

  useEffect(() => {
    Promise.resolve().then(load);
    // Realtime: yalnızca seçili sporun skor / dakika / analiz durumu değişiklikleri
    return dataSource.subscribeMatches(sport, (m) =>
      setData((prev) => {
        if (!prev || prev.sport !== sport) return prev;
        const map = new Map(prev.map);
        map.set(m.fixture_id, { ...prev.map.get(m.fixture_id), ...m });
        return { sport, map };
      }),
    );
  }, [sport, load]);

  const matches = useMemo(() => (data?.sport === sport ? data.map : new Map<number, Match>()), [data, sport]);
  const error = failure?.sport === sport ? failure.message : null;
  const loading = data?.sport !== sport && !error;

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
    // Aynı turnuvanın alt grupları (… · Lig A, … · Lig B) alfabetik sırayla art arda gelir
    const out = [...byLeague.values()].sort(
      (a, b) => a.priority - b.priority || a.league_name.localeCompare(b.league_name, 'tr'),
    );
    for (const g of out) {
      g.data.sort((a, b) => stateRank(a) - stateRank(b) || a.kickoff_at.localeCompare(b.kickoff_at));
    }
    return out;
  }, [matches, filter]);

  const liveCount = useMemo(() => [...matches.values()].filter((m) => isLive(m.status_short)).length, [matches]);

  return { groups, liveCount, loading, error, reload: load };
}
