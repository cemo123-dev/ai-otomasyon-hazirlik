import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { dataSource } from '@/lib/data';
import type { SubscriptionPlan } from '@/lib/types';

type PremiumCtx = {
  isPremium: boolean;
  loading: boolean;
  setPlan: (plan: SubscriptionPlan | null) => Promise<void>;
};

const Ctx = createContext<PremiumCtx | null>(null);

export function PremiumProvider({ children }: { children: ReactNode }) {
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dataSource
      .getPremium()
      .then(setIsPremium)
      .catch(() => setIsPremium(false))
      .finally(() => setLoading(false));
  }, []);

  const setPlan = useCallback(async (plan: SubscriptionPlan | null) => {
    setLoading(true);
    try {
      setIsPremium(await dataSource.simulateSubscription(plan));
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo(() => ({ isPremium, loading, setPlan }), [isPremium, loading, setPlan]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePremium() {
  const v = useContext(Ctx);
  if (!v) throw new Error('usePremium, PremiumProvider içinde kullanılmalı');
  return v;
}
