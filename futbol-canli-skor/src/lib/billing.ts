/**
 * RevenueCat paket → paywall planı ve abonelik metinleri — SAF modül (içe aktarma yok; Deno test eder:
 * supabase/functions/tests/billing.test.ts). RevenueCat tipleri yapısal olarak alınır (`PurchasesPackage` uyar).
 *
 * Kurallar (pazarlama §4.3 ve §8):
 * - Fiyat HİÇBİR ZAMAN kodda yazmaz; mağazanın yerelleştirilmiş `priceString`'i gösterilir (Play kendi fiyatını gösterir).
 * - Deneme varsa: süre + "sonra <fiyat> / <dönem>" + otomatik yenileme + iptal yolu, deneme başlamadan görünür.
 * - "Ömür boyu", "ücretsiz Pro", ödül vaadi yok.
 */

export type PlanKind = 'monthly' | 'yearly';

/** RevenueCat `PricingPhase.billingPeriod` / `Period` yapısı */
type PeriodLike = { unit: string; value: number } | null | undefined;

/** `PurchasesPackage` alt kümesi (yapısal) */
export type PackageLike = {
  identifier: string;
  packageType: string;
  product: {
    identifier: string;
    priceString: string;
    subscriptionPeriod?: string | null;
    defaultOption?: {
      freePhase?: { billingPeriod?: PeriodLike } | null;
    } | null;
    introPrice?: { price: number; periodUnit?: string; periodNumberOfUnits?: number } | null;
  };
};

export type StorePlan = {
  /** RevenueCat paket kimliği (satın alma bununla eşleşir) */
  packageId: string;
  kind: PlanKind;
  title: string;
  /** Mağazanın yerelleştirilmiş fiyat metni (ör. "₺59,99") */
  priceString: string;
  /** "/ ay" | "/ yıl" */
  per: string;
  /** Ücretsiz deneme günü (Play deneme teklifi); yoksa null */
  trialDays: number | null;
};

const DAY_PER: Record<string, number> = { DAY: 1, WEEK: 7, MONTH: 30, YEAR: 365 };

/** Deneme süresi gün olarak: Google `defaultOption.freePhase`, yoksa (iOS) `introPrice` fiyatı 0 ise */
export function trialDaysOf(p: PackageLike['product']): number | null {
  const free = p.defaultOption?.freePhase?.billingPeriod;
  if (free && DAY_PER[free.unit] && free.value > 0) return free.value * DAY_PER[free.unit];
  const intro = p.introPrice;
  if (intro && intro.price === 0 && intro.periodUnit && DAY_PER[intro.periodUnit] && (intro.periodNumberOfUnits ?? 0) > 0) {
    return (intro.periodNumberOfUnits ?? 0) * DAY_PER[intro.periodUnit];
  }
  return null;
}

/** Paket türü / ISO 8601 dönem → plan türü. Aylık ve yıllık dışındakiler paywall'da gösterilmez. */
export function planKindOf(pkg: PackageLike): PlanKind | null {
  if (pkg.packageType === 'MONTHLY') return 'monthly';
  if (pkg.packageType === 'ANNUAL') return 'yearly';
  const period = pkg.product.subscriptionPeriod ?? '';
  if (period === 'P1M') return 'monthly';
  if (period === 'P1Y') return 'yearly';
  return null;
}

/** Teklifteki paketler → en çok bir aylık + bir yıllık plan (önce yıllık); fiyat boşsa paket atılır */
export function plansFromPackages(pkgs: readonly PackageLike[] | null | undefined): StorePlan[] {
  const out: StorePlan[] = [];
  for (const pkg of pkgs ?? []) {
    const kind = planKindOf(pkg);
    if (!kind || out.some((p) => p.kind === kind)) continue;
    const priceString = String(pkg.product.priceString ?? '').trim();
    if (!priceString) continue;
    out.push({
      packageId: pkg.identifier,
      kind,
      title: kind === 'monthly' ? 'Aylık' : 'Yıllık',
      priceString,
      per: kind === 'monthly' ? '/ ay' : '/ yıl',
      trialDays: trialDaysOf(pkg.product),
    });
  }
  return out.sort((a, b) => (a.kind === b.kind ? 0 : a.kind === 'yearly' ? -1 : 1));
}

/** Seçili plan için paywall alt metni (deneme başlamadan görünür; pazarlama §4.3) */
export function planTerms(p: StorePlan): string {
  const period = p.kind === 'monthly' ? 'ay' : 'yıl';
  const renew = `Abonelik her ${period} otomatik yenilenir; Google Play > Abonelikler'den istediğin zaman iptal edebilirsin.`;
  if (p.trialDays) {
    return `${p.trialDays} gün ücretsiz dene, deneme bitince ${p.priceString} / ${period} ücretlendirilir. Deneme bitmeden iptal edersen ücret alınmaz. ${renew}`;
  }
  return `${p.priceString} / ${period}. ${renew}`;
}

/** Ana düğme metni */
export const planCta = (p: StorePlan): string => (p.trialDays ? `${p.trialDays} gün ücretsiz dene` : 'Aboneliği başlat');

/** Google Play abonelik yönetimi sayfası (pazarlama §4.3: "Abonelikleri yönet") */
export function manageSubscriptionUrl(packageName: string, productId?: string | null): string {
  const pkg = encodeURIComponent(packageName);
  return productId
    ? `https://play.google.com/store/account/subscriptions?sku=${encodeURIComponent(productId)}&package=${pkg}`
    : `https://play.google.com/store/account/subscriptions?package=${pkg}`;
}

/** CustomerInfo'da yetki aktif mi (yapısal) */
export function entitlementActive(info: { entitlements?: { active?: Record<string, unknown> } } | null | undefined, id: string): boolean {
  return !!info?.entitlements?.active && Object.prototype.hasOwnProperty.call(info.entitlements.active, id);
}
