import { useEffect, useState, type ReactNode } from 'react';
import { AccessibilityInfo, ActivityIndicator, Animated, Platform, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { liveLabel } from '@/lib/status';
import { colors, hit, motion, radius, space } from '@/theme';

export const useNativeDriver = Platform.OS !== 'web';

/**
 * Yazı ölçeği sınırı: native'de `maxFontSizeMultiplier`, web'de (RN-web'de karşılığı yok) yalnız
 * e2e/largefont_ui.mjs benzetiminin okuduğu `data-maxfontscale` işareti. Kullanım: `<Text {...maxFontScale(1.2)}>`.
 */
export function maxFontScale(n: number): { maxFontSizeMultiplier: number } {
  return Platform.OS === 'web'
    ? ({ maxFontSizeMultiplier: n, dataSet: { maxfontscale: String(n) } } as { maxFontSizeMultiplier: number })
    : { maxFontSizeMultiplier: n };
}

export function Card({ children, style, accent }: { children: ReactNode; style?: StyleProp<ViewStyle>; accent?: string }) {
  return (
    <View style={[styles.card, accent ? { borderColor: accent } : null, style]}>
      {children}
    </View>
  );
}

/**
 * kickerColor: AI raporlarında manşet dışındaki kartların kicker'ı altın (kenar normal kalır).
 * kicker kaynakta BÜYÜK HARFLE yazılır ("KİLİT EŞLEŞME"): textTransform 'uppercase' Türkçe "i"yi
 * "I" yapıyordu (tasarım incelemesi B-6).
 */
export function CardTitle({
  kicker,
  title,
  right,
  kickerColor,
}: {
  kicker?: string;
  title: string;
  right?: ReactNode;
  kickerColor?: string;
}) {
  return (
    <View style={styles.titleRow}>
      <View style={{ flex: 1 }}>
        {kicker ? <Text style={[styles.kicker, kickerColor ? { color: kickerColor } : null]}>{kicker}</Text> : null}
        <Text style={styles.title}>{title}</Text>
      </View>
      {right}
    </View>
  );
}

export function Badge({ label, color = colors.accent, filled }: { label: string; color?: string; filled?: boolean }) {
  return (
    <View style={[styles.badge, { borderColor: color, backgroundColor: filled ? color : 'transparent' }]}>
      <Text style={[styles.badgeText, { color: filled ? colors.onFill : color }]}>{label}</Text>
    </View>
  );
}

/** "Hareketi azalt" açık mı (web'de ve hata durumunda false) */
export function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => { if (alive) setReduce(v); })
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => { alive = false; sub.remove(); };
  }, []);
  return reduce;
}

/** Canlı maçlar için nabız atan yeşil nokta + dakika (metin sabit; yalnız nokta yanıp söner) */
/** label verilirse dakika yerine gösterilir (NBA: "Q3 04:12", "Devre Arası") */
export function LiveMinute({ minute, status, label: custom }: { minute: number | null; status: string; label?: string | null }) {
  const [opacity] = useState(() => new Animated.Value(1));
  const reduce = useReduceMotion();
  const still = status === 'HT' || status === 'SUSP' || status === 'INT'; // dakika ilerlemiyor: nokta da sabit
  useEffect(() => {
    if (still || reduce) {
      opacity.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.25, duration: motion.pulse, useNativeDriver }),
        Animated.timing(opacity, { toValue: 1, duration: motion.pulse, useNativeDriver }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity, still, reduce]);

  const label = custom ?? liveLabel(status, minute);
  return (
    <View style={styles.liveWrap}>
      <Animated.View style={[styles.liveDot, { opacity }]} />
      <Text style={styles.liveText}>{label}</Text>
    </View>
  );
}

/** Tam ekran hata / boş durum: simge + başlık + gövde + düğme + ipucu (tasarım rehberi §3.7) */
export function StateMessage({
  icon,
  title,
  body,
  action,
  onAction,
  primary = true,
  hint,
}: {
  icon?: string;
  title: string;
  body?: string | null;
  action?: string;
  onAction?: () => void;
  primary?: boolean;
  hint?: string;
}) {
  return (
    <View style={styles.state}>
      {icon ? <Text style={styles.stateIcon}>{icon}</Text> : null}
      <Text style={styles.stateTitle}>{title}</Text>
      {body ? <Text style={styles.stateBody}>{body}</Text> : null}
      {action && onAction ? (
        <Pressable
          accessibilityRole="button"
          onPress={onAction}
          style={({ pressed }) => [primary ? styles.btnPrimary : styles.btnSecondary, pressed && { opacity: 0.7 }]}
        >
          <Text style={primary ? styles.btnPrimaryText : styles.btnSecondaryText}>{action}</Text>
        </Pressable>
      ) : null}
      {hint ? <Text style={styles.stateHint}>{hint}</Text> : null}
    </View>
  );
}

/**
 * Uyarı bandı (tasarım tur 1 C-3 / B-5, tur 2 R-2): `surface` zemin, sol 3 px `warning` şerit, diğer kenarlar
 * `border`. Satır 1 turuncu başlık ("⚠ …"), satır 2 `textMuted` açıklama; altında isteğe bağlı ikincil eylem.
 * Ana ekran "Liste yenilenemedi", ayar hatası ve davet kartı hatası aynı iskeleti kullanır.
 */
export function InfoStrip({
  title,
  body,
  action,
  onAction,
  busy,
  actionLabel,
  style,
}: {
  title: string;
  body?: string | null;
  action?: string;
  onAction?: () => void;
  busy?: boolean;
  actionLabel?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.strip, style]} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <Text style={styles.stripTitle}>⚠ {title}</Text>
      {body ? <Text style={styles.stripBody}>{body}</Text> : null}
      {action && onAction ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel ?? action}
          disabled={busy}
          onPress={onAction}
          style={({ pressed }) => [styles.btnSecondary, styles.stripAction, (pressed || busy) && { opacity: 0.7 }]}
        >
          {busy ? <ActivityIndicator color={colors.text} size="small" /> : <Text style={styles.btnSecondaryText}>{action}</Text>}
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    padding: space(3),
    gap: 2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
    backgroundColor: colors.surface,
  },
  stripTitle: { color: colors.warning, fontSize: 13, lineHeight: 18, fontWeight: '700' },
  stripBody: { color: colors.textMuted, fontSize: 12, lineHeight: 17 },
  stripAction: { alignSelf: 'flex-start', marginTop: space(2), paddingHorizontal: space(4) },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space(4),
    gap: space(3),
  },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space(2) },
  kicker: { color: colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1.1, marginBottom: 2 },
  title: { color: colors.text, fontSize: 17, fontWeight: '800' },
  badge: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  badgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  liveWrap: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.live },
  liveText: { color: colors.live, fontWeight: '800', fontSize: 13, fontVariant: ['tabular-nums'] },
  state: { alignItems: 'center', gap: space(3), paddingHorizontal: space(6), paddingVertical: space(10) },
  stateIcon: { fontSize: 28, color: colors.warning },
  stateTitle: { color: colors.text, fontSize: 17, lineHeight: 22, fontWeight: '800', textAlign: 'center' },
  stateBody: { color: colors.textMuted, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  stateHint: { color: colors.textDim, fontSize: 12, lineHeight: 17, textAlign: 'center' },
  btnPrimary: {
    minHeight: 48,
    minWidth: 160,
    paddingHorizontal: space(5),
    borderRadius: radius.md,
    backgroundColor: colors.live,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: { color: colors.onFill, fontSize: 15, fontWeight: '800' },
  btnSecondary: {
    minHeight: hit,
    paddingHorizontal: space(5),
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondaryText: { color: colors.text, fontSize: 14, fontWeight: '700' },
});
