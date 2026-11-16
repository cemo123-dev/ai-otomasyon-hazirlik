import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Platform, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius, space } from '@/theme';

export const useNativeDriver = Platform.OS !== 'web';

export function Card({ children, style, accent }: { children: ReactNode; style?: StyleProp<ViewStyle>; accent?: string }) {
  return (
    <View style={[styles.card, accent ? { borderColor: accent } : null, style]}>
      {children}
    </View>
  );
}

export function CardTitle({ kicker, title, right }: { kicker?: string; title: string; right?: ReactNode }) {
  return (
    <View style={styles.titleRow}>
      <View style={{ flex: 1 }}>
        {kicker ? <Text style={styles.kicker}>{kicker}</Text> : null}
        <Text style={styles.title}>{title}</Text>
      </View>
      {right}
    </View>
  );
}

export function Badge({ label, color = colors.accent, filled }: { label: string; color?: string; filled?: boolean }) {
  return (
    <View style={[styles.badge, { borderColor: color, backgroundColor: filled ? color : 'transparent' }]}>
      <Text style={[styles.badgeText, { color: filled ? colors.bg : color }]}>{label}</Text>
    </View>
  );
}

/** Canlı maçlar için yanıp sönen yeşil nokta + dakika */
export function LiveMinute({ minute, status }: { minute: number | null; status: string }) {
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.25, duration: 650, useNativeDriver }),
        Animated.timing(opacity, { toValue: 1, duration: 650, useNativeDriver }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  const label = status === 'HT' ? 'İY' : `${minute ?? 0}'`;
  return (
    <View style={styles.liveWrap}>
      <Animated.View style={[styles.liveDot, { opacity }]} />
      <Animated.Text style={[styles.liveText, { opacity: status === 'HT' ? 1 : opacity }]}>{label}</Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space(4),
    gap: space(3),
  },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space(2) },
  kicker: { color: colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1.1, textTransform: 'uppercase', marginBottom: 2 },
  title: { color: colors.text, fontSize: 17, fontWeight: '800' },
  badge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  badgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
  liveWrap: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.live },
  liveText: { color: colors.live, fontWeight: '800', fontSize: 13, fontVariant: ['tabular-nums'] },
});
