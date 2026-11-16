import { useEffect, useState } from 'react';
import { dataSource } from '@/lib/data';
import type { Match } from '@/lib/types';

export function useMatch(fixtureId: number) {
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    // Önce abone ol, sonra çek: arada kaçan bir Realtime olayı olmasın
    const unsub = dataSource.subscribeMatch(fixtureId, (m) => {
      if (alive) setMatch((prev) => ({ ...(prev ?? {}), ...m }) as Match);
    });
    dataSource
      .getMatch(fixtureId)
      .then((m) => alive && setMatch(m))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
      unsub();
    };
  }, [fixtureId]);

  return { match, loading };
}
