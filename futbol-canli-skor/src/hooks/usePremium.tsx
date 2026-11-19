import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { dataSource } from '@/lib/data';
import { identifyPurchases, PURCHASES_ENABLED } from '@/lib/purchases';
import type { SubscriptionPlan } from '@/lib/types';

type PremiumCtx = {
  isPremium: boolean;
  loading: boolean;
  setPlan: (plan: SubscriptionPlan | null) => Promise<void>;
  /** Test aboneliği bu hesapta açık mı (yayın öncesi: yalnız izin listesi) */
  isTestUser: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  /** Gerçek satın alma (RevenueCat) açık mı: Android + `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` + önizleme değil */
  purchasesEnabled: boolean;
  /**
   * Satın alma / geri yükleme sonrası: sunucudaki Pro durumu webhook ile birkaç saniyede gelir; kısa aralıkla
   * yeniden okunur. Pro görülürse true.
   */
  syncAfterPurchase: () => Promise<boolean>;
};

const Ctx = createContext<PremiumCtx | null>(null);
const SYNC_TRIES = 8;
const SYNC_GAP_MS = 2000;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

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

  // RevenueCat kimliği = Supabase kullanıcı kimliği (bayrak kapalıysa hiçbir şey yapmaz)
  useEffect(() => {
    if (!PURCHASES_ENABLED) return;
    dataSource
      .getAccountId()
      .then(identifyPurchases)
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
    if (PURCHASES_ENABLED) await identifyPurchases(await dataSource.getAccountId().catch(() => null));
  }, []);

  const syncAfterPurchase = useCallback(async () => {
    for (let i = 0; i < SYNC_TRIES; i++) {
      const p = await dataSource.getPremium().catch(() => false);
      if (p) {
        setIsPremium(true);
        return true;
      }
      await wait(SYNC_GAP_MS);
    }
    return false;
  }, []);

  const value = useMemo(
    () => ({ isPremium, loading, setPlan, isTestUser, error, refresh, purchasesEnabled: PURCHASES_ENABLED, syncAfterPurchase }),
    [isPremium, loading, setPlan, isTestUser, error, refresh, syncAfterPurchase],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePremium() {
  const v = useContext(Ctx);
  if (!v) throw new Error('usePremium, PremiumProvider içinde kullanılmalı');
  return v;
}
