import { Linking, Platform } from 'react-native';
import Purchases, { type PurchasesPackage } from 'react-native-purchases';
import { entitlementActive, manageSubscriptionUrl, plansFromPackages, type StorePlan } from './billing';
import { STORE_PACKAGE } from './store';
import { PREVIEW_MODE } from './supabase';

/**
 * RevenueCat + Google Play Billing (P2, docs/inovasyon-onerileri.md §0.5/§0.6). ÖZELLİK BAYRAĞI:
 * `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` (RevenueCat "Public SDK key", gizli değil; EAS ortam değişkeni) boşsa
 * satın alma tamamen kapalı ve paywall bugünkü gibi davranır (test hesabı simülasyonu korunur).
 * Web karşılığı `purchases.web.ts` (Metro platform uzantısı): web paketi native modülü hiç içe aktarmaz.
 *
 * Kimlik: `appUserID` = Supabase kullanıcı kimliği (anonim hesap dahil). Pro durumu sunucuda tutulur:
 * RevenueCat webhook'u (`supabase/functions/revenuecat-webhook`) `profiles.is_premium` /
 * `subscription_expires_at` yazar; istemci satın alma sonrası sunucuyu yeniden okur (usePremium).
 */
const API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY?.trim() ?? '';
/** RevenueCat yetki (entitlement) kimliği; panelde aynı ad (varsayılan `pro`) */
export const ENTITLEMENT_ID = process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT?.trim() || 'pro';
export const PURCHASES_ENABLED = Platform.OS === 'android' && !PREVIEW_MODE && API_KEY !== '';

let configuredFor: string | null = null;
let packages = new Map<string, PurchasesPackage>();

/** Uygulama açılışında ve hesap değişince (silme sonrası yeni anonim hesap). Hata yutulur. */
export async function identifyPurchases(userId: string | null): Promise<void> {
  if (!PURCHASES_ENABLED || !userId || configuredFor === userId) return;
  try {
    if (configuredFor === null) {
      Purchases.configure({ apiKey: API_KEY, appUserID: userId });
    } else {
      await Purchases.logIn(userId);
    }
    configuredFor = userId;
  } catch (e) {
    console.warn('[purchases] kimlik', (e as { message?: string } | null)?.message ?? e);
  }
}

const ready = () => PURCHASES_ENABLED && configuredFor !== null;

/** Geçerli teklifin aylık / yıllık planları (fiyat mağazadan). Yapılandırılmadıysa boş. */
export async function loadStorePlans(): Promise<StorePlan[]> {
  if (!ready()) return [];
  const offerings = await Purchases.getOfferings();
  const list = offerings.current?.availablePackages ?? [];
  packages = new Map(list.map((p) => [p.identifier, p]));
  return plansFromPackages(list);
}

export type PurchaseOutcome = 'active' | 'pending' | 'cancelled' | 'error';

export async function purchasePlan(packageId: string): Promise<PurchaseOutcome> {
  const pkg = packages.get(packageId);
  if (!ready() || !pkg) return 'error';
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return entitlementActive(customerInfo, ENTITLEMENT_ID) ? 'active' : 'pending';
  } catch (e) {
    const err = e as { code?: string; userCancelled?: boolean | null };
    if (err?.userCancelled || err?.code === Purchases.PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) return 'cancelled';
    if (err?.code === Purchases.PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR) return 'pending';
    console.warn('[purchases] satın alma', (e as { message?: string } | null)?.message ?? e);
    return 'error';
  }
}

/** "Satın alımları geri yükle": yetki aktifse true */
export async function restorePurchases(): Promise<boolean> {
  if (!ready()) return false;
  const info = await Purchases.restorePurchases();
  return entitlementActive(info, ENTITLEMENT_ID);
}

/** Google Play abonelik yönetimi (pazarlama §4.3). RevenueCat `managementURL` varsa o, yoksa Play adresi. */
export async function openManageSubscriptions(): Promise<void> {
  let url = manageSubscriptionUrl(STORE_PACKAGE);
  if (ready()) {
    try {
      const info = await Purchases.getCustomerInfo();
      url = info.managementURL ?? manageSubscriptionUrl(STORE_PACKAGE, info.activeSubscriptions[0]?.split(':')[0] ?? null);
    } catch {
      /* Play adresi yeterli */
    }
  }
  await Linking.openURL(url);
}
