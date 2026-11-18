import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { dataSource } from '@/lib/data';
import { friendlyError } from '@/lib/errors';
import type { Match } from '@/lib/types';

/** Daha eski veri daha yeniyi ezmesin: updated_at karşılaştırması (yoksa gelen kabul edilir) */
export function mergeMatch(prev: Match | null | undefined, next: Match): Match {
  if (!prev) return next;
  const p = prev.updated_at ? Date.parse(prev.updated_at) : NaN;
  const n = next.updated_at ? Date.parse(next.updated_at) : NaN;
  // Geç dönen çekim, arada gelen daha yeni Realtime satırını ezmez (yalnız eksik alanları tamamlar)
  if (Number.isFinite(p) && Number.isFinite(n) && n < p) return { ...next, ...prev };
  return { ...prev, ...next };
}

export function useMatch(fixtureId: number) {
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const alive = useRef(true);

  const load = useCallback(async () => {
    try {
      const m = await dataSource.getMatch(fixtureId);
      if (!alive.current) return;
      setError(null);
      if (m) setMatch((prev) => mergeMatch(prev, m));
    } catch (e) {
      if (alive.current) setError(friendlyError(e, 'Maç yüklenemedi. Tekrar dene.'));
    } finally {
      if (alive.current) setLoading(false);
    }
  }, [fixtureId]);

  useEffect(() => {
    alive.current = true;
    // Önce abone ol, sonra çek: arada kaçan bir Realtime olayı olmasın
    const unsub = dataSource.subscribeMatch(fixtureId, (m) => {
      if (alive.current) setMatch((prev) => mergeMatch(prev, m));
    });
    Promise.resolve().then(load);
    // Uygulama öne gelince tazele: arka planda kaçan Realtime olayları yeniden gönderilmez
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') load();
    });
    return () => {
      alive.current = false;
      unsub();
      sub.remove();
    };
  }, [fixtureId, load]);

  const reload = useCallback(async () => {
    setLoading((l) => l || match == null);
    await load();
  }, [load, match]);

  return { match, loading, error, reload };
}
