import type { StorePlan } from './billing';

/**
 * Web (önizleme / e2e) karşılığı: satın alma her zaman kapalı. `react-native-purchases` web paketine girmez
 * (Metro `.web.ts` uzantısını seçer). API `purchases.ts` ile aynı.
 */
export const ENTITLEMENT_ID = 'pro';
export const PURCHASES_ENABLED = false;
export type PurchaseOutcome = 'active' | 'pending' | 'cancelled' | 'error';

export async function identifyPurchases(_userId: string | null): Promise<void> {}
export async function loadStorePlans(): Promise<StorePlan[]> {
  return [];
}
export async function purchasePlan(_packageId: string): Promise<PurchaseOutcome> {
  return 'error';
}
export async function restorePurchases(): Promise<boolean> {
  return false;
}
export async function openManageSubscriptions(): Promise<void> {}
