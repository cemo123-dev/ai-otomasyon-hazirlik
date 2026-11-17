import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { dataSource } from '@/lib/data';
import type { SubscriptionPlan } from '@/lib/types';

type PremiumCtx = {
  isPremium: boolean;
  loading: boolean;
  setPlan: (plan: SubscriptionPlan | null) => Promise<void>;
  /** Test aboneliği bu hesapta açık mı (yayın öncesi: yalnız izin listesi) */
  isTestUser: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const Ctx = createContext<PremiumCtx | null>(null);

export function PremiumProvider({ children }: { children: ReactNode }) {
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isTestUser, setIsTestUser] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dataSource
      .getPremium()
      .then(setIsPremium)
      .catch(() => setIsPremium(false))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    dataSource
      .isTestUser()
      .then(setIsTestUser)
      .catch(() => {});
  }, []);

  const setPlan = useCallback(async (plan: SubscriptionPlan | null) => {
    setLoading(true);
    setError(null);
    try {
      setIsPremium(await dataSource.simulateSubscription(plan));
    } catch (e) {
      setError((e as { message?: string } | null)?.message === 'not_allowed' ? 'Test aboneliği bu hesapta kapalı.' : 'Abonelik güncellenemedi.');
    } finally {
      setLoading(false);
    }
  }, []);

  /** Hesap değiştiğinde (ör. silme sonrası yeni anonim hesap) durumu yeniden oku */
  const refresh = useCallback(async () => {
    const [p, t] = await Promise.all([dataSource.getPremium().catch(() => false), dataSource.isTestUser().catch(() => false)]);
    setIsPremium(p);
    setIsTestUser(t);
  }, []);

  const value = useMemo(
    () => ({ isPremium, loading, setPlan, isTestUser, error, refresh }),
    [isPremium, loading, setPlan, isTestUser, error, refresh],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePremium() {
  const v = useContext(Ctx);
  if (!v) throw new Error('usePremium, PremiumProvider içinde kullanılmalı');
  return v;
}
