import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { dataSource } from '@/lib/data';
import { ensurePushRegistration } from '@/lib/notifications';
import type { FollowedTeam } from '@/lib/types';

export const teamKey = (sport: string, id: number) => `${sport}:${id}`;

type FollowsCtx = {
  followed: Set<number>;
  toggle: (fixtureId: number) => Promise<void>;
  /** Takip edilen takımlar; anahtar teamKey(sport, id) */
  teams: Map<string, FollowedTeam>;
  toggleTeam: (t: FollowedTeam) => Promise<void>;
  /** Son push kaydı uyarısı (ör. Expo Go'da bildirim yok); null = sorun yok */
  pushNotice: string | null;
};

const Ctx = createContext<FollowsCtx | null>(null);

/** Maç takibi: devre arası bildirimi yalnız takip edilen maçlar için gelir */
export function FollowsProvider({ children }: { children: ReactNode }) {
  const [followed, setFollowed] = useState<Set<number>>(new Set());
  const [teams, setTeams] = useState<Map<string, FollowedTeam>>(new Map());
  const [pushNotice, setPushNotice] = useState<string | null>(null);

  const reloadFollowed = useCallback(
    () =>
      dataSource
        .listFollowedIds()
        .then((ids) => setFollowed(new Set(ids)))
        .catch(() => {}),
    [],
  );

  useEffect(() => {
    Promise.resolve().then(reloadFollowed);
    dataSource
      .listFollowedTeams()
      .then((list) => setTeams(new Map(list.map((t) => [teamKey(t.sport_type, t.team_id), t]))))
      .catch(() => {}); // 0010 kurulmadıysa takım takibi görünmez
  }, [reloadFollowed]);

  const registerPush = useCallback(async () => {
    // İlk takipte bildirim izni + token kaydı; başarısızsa takip yine geçerli
    const r = await ensurePushRegistration();
    setPushNotice(r.ok ? null : r.reason);
  }, []);

  const toggle = useCallback(async (fixtureId: number) => {
    const now = await dataSource.toggleFollow(fixtureId);
    setFollowed((prev) => {
      const next = new Set(prev);
      if (now) next.add(fixtureId);
      else next.delete(fixtureId);
      return next;
    });
    if (now) await registerPush();
  }, [registerPush]);

  const toggleTeam = useCallback(
    async (t: FollowedTeam) => {
      const now = await dataSource.toggleTeamFollow(t);
      setTeams((prev) => {
        const next = new Map(prev);
        if (now) next.set(teamKey(t.sport_type, t.team_id), t);
        else next.delete(teamKey(t.sport_type, t.team_id));
        return next;
      });
      // Sunucu takımın başlamamış maçlarını da takibe aldı
      await reloadFollowed();
      if (now) await registerPush();
    },
    [reloadFollowed, registerPush],
  );

  const value = useMemo(() => ({ followed, toggle, teams, toggleTeam, pushNotice }), [followed, toggle, teams, toggleTeam, pushNotice]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useFollows() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useFollows, FollowsProvider içinde kullanılmalı');
  return v;
}
