import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { usePremium } from '@/hooks/usePremium';
import { planCta, planTerms, type StorePlan } from '@/lib/billing';
import { loadStorePlans, openManageSubscriptions, purchasePlan, restorePurchases } from '@/lib/purchases';
import { colors, radius, space } from '@/theme';

const FEATURES = [
  'Her maç sonu AI taktik raporu',
  'xG & şut kalitesi denetimi',
  'Momentum kırılma anları',
  'Teknik direktör etki deltası & maçın yıldızı',
];

/**
 * Gerçek satın alma paywall'u (RevenueCat, yalnız `PURCHASES_ENABLED`). Planlar ve fiyat mağazadan gelir
 * (kodda fiyat yok); deneme / yenileme / iptal metni satın almadan önce görünür (pazarlama §4.3, §8).
 * Satın alma ve geri yükleme sonrası Pro durumu sunucudan (webhook) okunur.
 */
export function StorePaywall() {
  const { isPremium, syncAfterPurchase } = usePremium();
  const [plans, setPlans] = useState<StorePlan[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState<'buy' | 'restore' | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(false);
    setPlans(null);
    try {
      const p = await loadStorePlans();
      setPlans(p);
      setSelected((cur) => cur ?? p[0]?.packageId ?? null);
    } catch {
      setLoadError(true);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(load);
  }, [load]);

  const plan = plans?.find((p) => p.packageId === selected) ?? null;

  const finish = async (okText: string) => {
    setMsg('Pro etkinleştiriliyor…');
    const ok = await syncAfterPurchase();
    setMsg(ok ? okText : 'Satın alma alındı. Pro birkaç dakika içinde açılır; açılmazsa "Satın alımları geri yükle"ye dokun.');
    if (ok && router.canGoBack()) router.back();
  };

  const buy = async () => {
    if (!plan || busy) return;
    setBusy('buy');
    setMsg(null);
    const out = await purchasePlan(plan.packageId);
    if (out === 'active') await finish('Pro aktif. Teşekkürler!');
    else if (out === 'pending') setMsg('Ödeme onay bekliyor. Onaylanınca Pro kendiliğinden açılır.');
    else if (out === 'error') setMsg('Satın alma tamamlanamadı. Tekrar dene.');
    setBusy(null);
  };

  const restore = async () => {
    if (busy) return;
    setBusy('restore');
    setMsg(null);
    try {
      if (await restorePurchases()) await finish('Aboneliğin geri yüklendi.');
      else setMsg('Bu Google hesabında etkin Skor+ Pro aboneliği bulunamadı.');
    } catch {
      setMsg('Geri yükleme yapılamadı. Tekrar dene.');
    }
    setBusy(null);
  };

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={styles.content}>
      <Text style={styles.kicker}>✦ SKOR+ PRO</Text>
      <Text style={styles.title}>Skoru herkes görür.{'\n'}Nedenini Pro üyeler görür.</Text>
      <Text style={styles.sub}>Skorlar herkese ücretsiz. Maç sonu AI taktik analizleri Pro üyelere özel.</Text>

      <View style={{ gap: space(2) }}>
        {FEATURES.map((f) => (
          <Text key={f} style={styles.feature}>
            <Text style={{ color: colors.live }}>✓ </Text>
            {f}
          </Text>
        ))}
      </View>

      {isPremium ? <Text style={styles.active}>Pro aboneliğin aktif.</Text> : null}

      {plans == null && !loadError ? (
        <ActivityIndicator color={colors.pro} />
      ) : loadError || !plans?.length ? (
        <View style={{ gap: space(2), alignItems: 'center' }}>
          <Text style={styles.sub}>Planlar şu an yüklenemedi.</Text>
          <Pressable accessibilityRole="button" onPress={load} style={styles.secondary}>
            <Text style={styles.secondaryText}>Tekrar dene</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={{ gap: space(3) }} accessibilityRole="radiogroup">
            {plans.map((p) => {
              const active = p.packageId === selected;
              return (
                <Pressable
                  key={p.packageId}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: active }}
                  onPress={() => setSelected(p.packageId)}
                  style={[styles.plan, active && styles.planActive]}
                >
                  <View style={[styles.radio, active && styles.radioActive]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.planTitle}>{p.title}</Text>
                    {p.trialDays ? <Text style={styles.planNote}>{p.trialDays} gün ücretsiz deneme</Text> : null}
                  </View>
                  <Text style={styles.price}>
                    {p.priceString}
                    <Text style={styles.per}> {p.per}</Text>
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {plan ? <Text style={styles.terms}>{planTerms(plan)}</Text> : null}
          <Pressable
            accessibilityRole="button"
            onPress={buy}
            disabled={!plan || !!busy || isPremium}
            style={({ pressed }) => [styles.cta, (pressed || isPremium) && { opacity: 0.6 }]}
          >
            {busy === 'buy' ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.ctaText}>{plan ? planCta(plan) : 'Aboneliği başlat'}</Text>}
          </Pressable>
        </>
      )}

      {msg ? (
        <Text style={styles.msg} accessibilityLiveRegion="polite">
          {msg}
        </Text>
      ) : null}

      <View style={styles.links}>
        <Pressable accessibilityRole="button" onPress={restore} disabled={!!busy} style={styles.linkBtn}>
          {busy === 'restore' ? <ActivityIndicator color={colors.textMuted} /> : <Text style={styles.link}>Satın alımları geri yükle</Text>}
        </Pressable>
        <Pressable accessibilityRole="link" onPress={() => void openManageSubscriptions()} style={styles.linkBtn}>
          <Text style={styles.link}>Abonelikleri yönet</Text>
        </Pressable>
      </View>
      <Text style={styles.legal}>{"Ödeme Google Play hesabından alınır. Fiyatlar KDV dahildir ve Google Play'de gösterilen fiyattır."}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space(5), gap: space(5), paddingBottom: space(12), width: '100%', maxWidth: 560, alignSelf: 'center' },
  kicker: { color: colors.pro, fontWeight: '900', letterSpacing: 1.4, fontSize: 12 },
  title: { color: colors.text, fontSize: 26, fontWeight: '900', lineHeight: 32 },
  sub: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  feature: { color: colors.text, fontSize: 15 },
  active: { color: colors.live, fontWeight: '800', fontSize: 15 },
  plan: { flexDirection: 'row', alignItems: 'center', gap: space(3), padding: space(4), borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface },
  planActive: { borderColor: colors.pro, backgroundColor: colors.proGlow },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.textDim },
  radioActive: { borderColor: colors.pro, backgroundColor: colors.pro },
  planTitle: { color: colors.text, fontWeight: '800', fontSize: 16 },
  planNote: { color: colors.live, fontWeight: '700', fontSize: 12, marginTop: 2 },
  price: { color: colors.text, fontWeight: '900', fontSize: 18 },
  per: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  terms: { color: colors.textMuted, fontSize: 12, lineHeight: 18 },
  cta: { backgroundColor: colors.pro, borderRadius: radius.md, paddingVertical: space(4), alignItems: 'center', minHeight: 48, justifyContent: 'center' },
  ctaText: { color: colors.bg, fontWeight: '900', fontSize: 16 },
  msg: { color: colors.text, fontSize: 13, lineHeight: 18, textAlign: 'center' },
  links: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: space(4) },
  linkBtn: { minHeight: 44, justifyContent: 'center' },
  link: { color: colors.textMuted, fontWeight: '700', textDecorationLine: 'underline' },
  secondary: { minHeight: 44, paddingHorizontal: space(4), borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderStrong, justifyContent: 'center' },
  secondaryText: { color: colors.text, fontWeight: '700' },
  legal: { color: colors.textDim, fontSize: 11, lineHeight: 16, textAlign: 'center' },
});
