import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { dataSource } from '@/lib/data';
import { ensurePushRegistration } from '@/lib/notifications';

type FollowsCtx = {
  followed: Set<number>;
  toggle: (fixtureId: number) => Promise<void>;
  /** Son push kaydı uyarısı (ör. Expo Go'da bildirim yok); null = sorun yok */
  pushNotice: string | null;
};

const Ctx = createContext<FollowsCtx | null>(null);

/** Maç takibi: devre arası bildirimi yalnız takip edilen maçlar için gelir */
export function FollowsProvider({ children }: { children: ReactNode }) {
  const [followed, setFollowed] = useState<Set<number>>(new Set());
  const [pushNotice, setPushNotice] = useState<string | null>(null);

  useEffect(() => {
    dataSource
      .listFollowedIds()
      .then((ids) => setFollowed(new Set(ids)))
      .catch(() => {});
  }, []);

  const toggle = useCallback(async (fixtureId: number) => {
    const now = await dataSource.toggleFollow(fixtureId);
    setFollowed((prev) => {
      const next = new Set(prev);
      if (now) next.add(fixtureId);
      else next.delete(fixtureId);
      return next;
    });
    if (now) {
      // İlk takipte bildirim izni + token kaydı; başarısızsa takip yine geçerli
      const r = await ensurePushRegistration();
      setPushNotice(r.ok ? null : r.reason);
    }
  }, []);

  const value = useMemo(() => ({ followed, toggle, pushNotice }), [followed, toggle, pushNotice]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useFollows() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useFollows, FollowsProvider içinde kullanılmalı');
  return v;
}
