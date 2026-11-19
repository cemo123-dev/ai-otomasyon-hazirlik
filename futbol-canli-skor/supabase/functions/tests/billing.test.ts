// src/lib/billing.ts (RevenueCat paket → paywall planı, abonelik metni) — saf modül. npm run test:functions.
// Kurallar: pazarlama §4.3 (fiyat, dönem, deneme, otomatik yenileme, iptal yolu) ve §8 (fiyat koddan gelmez).
import { assert, assertEquals } from 'jsr:@std/assert@1';
import {
  entitlementActive,
  manageSubscriptionUrl,
  type PackageLike,
  planCta,
  planKindOf,
  plansFromPackages,
  planTerms,
  trialDaysOf,
} from '../../../src/lib/billing.ts';
import { findBannedShareTerms } from '../../../src/lib/share.ts';

const pkg = (id: string, type: string, price: string, freeDays: number | null, period: string | null = null): PackageLike => ({
  identifier: id,
  packageType: type,
  product: {
    identifier: `skor_pro_${id}`,
    priceString: price,
    subscriptionPeriod: period,
    defaultOption: freeDays ? { freePhase: { billingPeriod: { unit: 'DAY', value: freeDays } } } : { freePhase: null },
  },
});

Deno.test('plansFromPackages: önce yıllık, fiyat mağazadan aynen', () => {
  const plans = plansFromPackages([pkg('$rc_monthly', 'MONTHLY', '₺59,99', 7), pkg('$rc_annual', 'ANNUAL', '₺499,99', 7)]);
  assertEquals(plans.map((p) => [p.kind, p.priceString, p.per, p.trialDays, p.packageId]), [
    ['yearly', '₺499,99', '/ yıl', 7, '$rc_annual'],
    ['monthly', '₺59,99', '/ ay', 7, '$rc_monthly'],
  ]);
});

Deno.test('plansFromPackages: haftalık / ömür boyu / fiyatsız / ikinci aylık atılır', () => {
  const plans = plansFromPackages([
    pkg('w', 'WEEKLY', '₺19,99', null),
    pkg('l', 'LIFETIME', '₺999', null),
    pkg('m0', 'MONTHLY', '  ', null),
    pkg('m1', 'MONTHLY', '₺59,99', null),
    pkg('m2', 'MONTHLY', '₺49,99', null),
  ]);
  assertEquals(plans.map((p) => p.packageId), ['m1']);
  assertEquals(plansFromPackages(null), []);
});

Deno.test('planKindOf: CUSTOM paket ISO dönemden', () => {
  assertEquals(planKindOf(pkg('c', 'CUSTOM', '₺1', null, 'P1M')), 'monthly');
  assertEquals(planKindOf(pkg('c', 'CUSTOM', '₺1', null, 'P1Y')), 'yearly');
  assertEquals(planKindOf(pkg('c', 'CUSTOM', '₺1', null, 'P3M')), null);
});

Deno.test('trialDaysOf: Google freePhase, hafta, iOS introPrice, yok', () => {
  assertEquals(trialDaysOf(pkg('a', 'MONTHLY', '₺1', 7).product), 7);
  assertEquals(trialDaysOf({ identifier: 'x', priceString: '₺1', defaultOption: { freePhase: { billingPeriod: { unit: 'WEEK', value: 1 } } } }), 7);
  assertEquals(trialDaysOf({ identifier: 'x', priceString: '₺1', introPrice: { price: 0, periodUnit: 'DAY', periodNumberOfUnits: 3 } }), 3);
  assertEquals(trialDaysOf({ identifier: 'x', priceString: '₺1', introPrice: { price: 9.99, periodUnit: 'MONTH', periodNumberOfUnits: 1 } }), null);
  assertEquals(trialDaysOf(pkg('a', 'MONTHLY', '₺1', null).product), null);
});

Deno.test('planTerms: deneme süresi, sonraki ücret, otomatik yenileme ve iptal yolu aynı metinde', () => {
  const [yearly] = plansFromPackages([pkg('$rc_annual', 'ANNUAL', '₺499,99', 7)]);
  const t = planTerms(yearly);
  assertEquals(
    t,
    "7 gün ücretsiz dene, deneme bitince ₺499,99 / yıl ücretlendirilir. Deneme bitmeden iptal edersen ücret alınmaz. Abonelik her yıl otomatik yenilenir; Google Play > Abonelikler'den istediğin zaman iptal edebilirsin.",
  );
  assertEquals(planCta(yearly), '7 gün ücretsiz dene');
});

Deno.test('planTerms: denemesiz plan', () => {
  const [m] = plansFromPackages([pkg('$rc_monthly', 'MONTHLY', '₺59,99', null)]);
  assertEquals(planTerms(m), "₺59,99 / ay. Abonelik her ay otomatik yenilenir; Google Play > Abonelikler'den istediğin zaman iptal edebilirsin.");
  assertEquals(planCta(m), 'Aboneliği başlat');
});

Deno.test('metinlerde kodda sabit fiyat ve yasaklı vaat yok', () => {
  const plans = plansFromPackages([pkg('$rc_monthly', 'MONTHLY', 'X', 7), pkg('$rc_annual', 'ANNUAL', 'Y', null)]);
  for (const p of plans) {
    const t = planTerms(p) + planCta(p);
    assert(!/\d+,\d{2}/.test(t), 'sabit fiyat: ' + t);
    assert(!/ömür boyu|ücretsiz pro|garanti/i.test(t));
  }
  // paylaşım yasaklı listesinden 'ücretsiz pro' / 'ödül' / 'kesin' yok ('fiyat', 'abone ol' paywall'a özgü serbest)
  const all = plans.map(planTerms).join(' ');
  assertEquals(findBannedShareTerms(all).filter((x) => !['fiyat', 'abone ol'].includes(x)), []);
});

Deno.test('manageSubscriptionUrl ve entitlementActive', () => {
  assertEquals(manageSubscriptionUrl('com.skorplus.app'), 'https://play.google.com/store/account/subscriptions?package=com.skorplus.app');
  assertEquals(
    manageSubscriptionUrl('com.skorplus.app', 'skor_pro_monthly'),
    'https://play.google.com/store/account/subscriptions?sku=skor_pro_monthly&package=com.skorplus.app',
  );
  assert(entitlementActive({ entitlements: { active: { pro: {} } } }, 'pro'));
  assertEquals(entitlementActive({ entitlements: { active: { other: {} } } }, 'pro'), false);
  assertEquals(entitlementActive({ entitlements: { active: {} } }, 'toString'), false);
  assertEquals(entitlementActive(null, 'pro'), false);
});
