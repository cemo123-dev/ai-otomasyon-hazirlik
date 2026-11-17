import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { usePremium } from '@/hooks/usePremium';
import type { SubscriptionPlan } from '@/lib/types';
import { colors, radius, space } from '@/theme';

const PLANS: { key: SubscriptionPlan; title: string; price: string; per: string; note?: string }[] = [
  { key: 'monthly', title: 'Aylık', price: '₺79,99', per: '/ ay' },
  { key: 'yearly', title: 'Yıllık', price: '₺599,99', per: '/ yıl', note: '%37 tasarruf' },
];

const FEATURES = [
  'Her maç sonu AI taktik raporu',
  'xG & şut kalitesi denetimi',
  'Momentum kırılma anları',
  'Teknik direktör etki deltası & maçın yıldızı',
];

export default function PaywallModal() {
  const { isPremium, loading, setPlan, isTestUser, error } = usePremium();
  const [plan, setSelected] = useState<SubscriptionPlan>('yearly');

  const subscribe = async () => {
    await setPlan(plan);
    if (router.canGoBack()) router.back();
  };

  // Gerçek ödeme (RevenueCat) gelene kadar abonelik yalnız test hesaplarında açık
  if (!isTestUser) {
    return (
      <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={styles.content}>
        <Text style={styles.kicker}>✦ SKOR+ PRO</Text>
        <Text style={styles.title}>Pro abonelik çok yakında</Text>
        <Text style={styles.sub}>
          Maç sonu AI taktik analizleri, maç önü eşleşmeler, devre arası raporu ve taktik asistan Pro üyelere özel olacak.
          Abonelik satışı Google Play üzerinden başladığında bu ekrandan katılabileceksin.
        </Text>
        <View style={{ gap: space(2) }}>
          {FEATURES.map((f) => (
            <Text key={f} style={styles.feature}>
              <Text style={{ color: colors.live }}>✓ </Text>
              {f}
            </Text>
          ))}
        </View>
      </ScrollView>
    );
  }


  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={styles.content}>
      <Text style={styles.kicker}>✦ SKOR+ PRO</Text>
      <Text style={styles.title}>Skoru herkes görür.{'\n'}Nedenini Pro üyeler görür.</Text>
      <Text style={styles.sub}>Canlı skorlar herkese ücretsiz. Maç sonu AI taktik analizleri Pro üyelere özel.</Text>

      <View style={{ gap: space(2) }}>
        {FEATURES.map((f) => (
          <Text key={f} style={styles.feature}>
            <Text style={{ color: colors.live }}>✓ </Text>
            {f}
          </Text>
        ))}
      </View>

      <View style={{ gap: space(3) }}>
        {PLANS.map((p) => {
          const active = p.key === plan;
          return (
            <Pressable
              key={p.key}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              onPress={() => setSelected(p.key)}
              style={[styles.plan, active && styles.planActive]}
            >
              <View style={[styles.radio, active && styles.radioActive]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.planTitle}>{p.title}</Text>
                {p.note ? <Text style={styles.planNote}>{p.note}</Text> : null}
              </View>
              <Text style={styles.price}>
                {p.price}
                <Text style={styles.per}> {p.per}</Text>
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable onPress={subscribe} disabled={loading} style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]}>
        {loading ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.ctaText}>Aboneliği Başlat (Simülasyon)</Text>}
      </Pressable>
      {error ? <Text style={styles.legal}>{error}</Text> : null}

      {isPremium ? (
        <Pressable onPress={() => setPlan(null)} disabled={loading} style={styles.cancel}>
          <Text style={styles.cancelText}>Pro aktif · Simülasyonu sıfırla</Text>
        </Pressable>
      ) : null}

      <Text style={styles.legal}>
        Test hesabı: bu buton gerçek ödeme almaz, yalnızca bu hesabın Pro durumunu değiştirir. Diğer kullanıcılar bu
        butonu görmez.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space(5), gap: space(5), paddingBottom: space(12), width: '100%', maxWidth: 560, alignSelf: 'center' },
  kicker: { color: colors.pro, fontWeight: '900', letterSpacing: 1.4, fontSize: 12 },
  title: { color: colors.text, fontSize: 26, fontWeight: '900', lineHeight: 32 },
  sub: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  feature: { color: colors.text, fontSize: 15 },
  plan: { flexDirection: 'row', alignItems: 'center', gap: space(3), padding: space(4), borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface },
  planActive: { borderColor: colors.pro, backgroundColor: colors.proGlow },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.textDim },
  radioActive: { borderColor: colors.pro, backgroundColor: colors.pro },
  planTitle: { color: colors.text, fontWeight: '800', fontSize: 16 },
  planNote: { color: colors.live, fontWeight: '700', fontSize: 12, marginTop: 2 },
  price: { color: colors.text, fontWeight: '900', fontSize: 18 },
  per: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  cta: { backgroundColor: colors.pro, borderRadius: radius.md, paddingVertical: space(4), alignItems: 'center' },
  ctaText: { color: colors.bg, fontWeight: '900', fontSize: 16 },
  cancel: { alignItems: 'center' },
  cancelText: { color: colors.textMuted, fontWeight: '700', textDecorationLine: 'underline' },
  legal: { color: colors.textDim, fontSize: 11, lineHeight: 16, textAlign: 'center' },
});
