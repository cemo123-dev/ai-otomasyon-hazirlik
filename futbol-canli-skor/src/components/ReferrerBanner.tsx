import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useReferrerBannerHidden, useSuggestedInviteCode } from '@/hooks/useReferrer';
import { hideReferrerBanner } from '@/lib/installReferrer';
import { colors, hit, radius, space, type } from '@/theme';

/**
 * Döngü 11 (§0.8): Install Referrer'da geçerli davet kodu varsa ana ekranda ince, kapatılabilir bant.
 * Kod burada GÖNDERİLMEZ; onay Ayarlar'daki davet kartında ("Seni davet eden kodu bulduk").
 * Kapatmak yalnız bandı gizler, öneri Ayarlar'da kalır.
 */
export function ReferrerBanner() {
  const code = useSuggestedInviteCode();
  const hidden = useReferrerBannerHidden();
  if (!code || hidden) return null;
  return (
    <View style={styles.band}>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel="Davet kodun hazır. Ayarlar'da onayla."
        onPress={() => router.push('/settings')}
        style={styles.body}
      >
        <Text style={styles.text}>
          Davet kodun hazır. <Text style={styles.link}>{"Ayarlar'da onayla."}</Text>
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Davet bandını kapat"
        hitSlop={4}
        onPress={() => void hideReferrerBanner()}
        style={styles.close}
      >
        <Text style={styles.closeText}>×</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  band: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: space(4),
    marginBottom: space(2),
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingLeft: space(3),
  },
  body: { flex: 1, minWidth: 0, minHeight: hit, justifyContent: 'center', paddingVertical: space(2) },
  text: { ...type.caption, color: colors.text },
  link: { color: colors.accent, fontWeight: '700' },
  close: { minWidth: hit, minHeight: hit, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: colors.textMuted, fontSize: 20, fontWeight: '700' },
});
