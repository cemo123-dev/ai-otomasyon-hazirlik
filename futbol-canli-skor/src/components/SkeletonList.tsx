import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import type { Sport } from '@/lib/types';
import { colors, radius, space } from '@/theme';
import { useNativeDriver, useReduceMotion } from './ui';

// 3 lig kartı; satır sayıları sırasıyla 2, 1, 2 (tasarım tur 3 §D-1)
const CARDS = [2, 1, 2];

/**
 * Ana ekranın ilk yüklemesinde dönen simge yerine listenin şekli (tasarım tur 3 §D-1). Ölçüler gerçek listeyle
 * aynı (lig başlığı 44, MatchRow minHeight 64 / boşluklar, kart altı `leagueFooter`): veri gelince kayma olmaz.
 * Tek `Animated.View`, tek döngü (opacity 0.55 ↔ 1, 900 ms); "Hareketi azalt" açıkken sabit 0.8.
 * Yalnız ilk yüklemede / gün-spor değişip veri yokken; aşağı çekerek ve arka plan yenilemesinde gösterilmez.
 */
export function SkeletonList({ sport }: { sport: Sport }) {
  const reduce = useReduceMotion();
  const [opacity] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (reduce) {
      opacity.setValue(0.8);
      return;
    }
    const ease = Easing.inOut(Easing.ease);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.55, duration: 900, easing: ease, useNativeDriver }),
        Animated.timing(opacity, { toValue: 1, duration: 900, easing: ease, useNativeDriver }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduce, opacity]);

  const statusW = sport === 'nba' ? 56 : 36;
  const statusCol = sport === 'nba' ? 76 : 48;

  return (
    <View style={styles.list} accessible accessibilityRole="progressbar" accessibilityLabel="Maçlar yükleniyor">
      <Animated.View style={{ opacity }} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        {CARDS.map((rows, ci) => (
          <View key={ci} style={styles.card}>
            <View style={styles.header}>
              <View style={[styles.bar, { width: 120, height: 14 }]} />
              <View style={[styles.bar, { width: 64, height: 12 }]} />
            </View>
            {Array.from({ length: rows }, (_, ri) => (
              <View key={ri} style={[styles.row, ri > 0 && styles.rowSep]}>
                <View style={{ width: statusCol }}>
                  <View style={[styles.bar, { width: statusW, height: 12 }]} />
                </View>
                <View style={styles.teams}>
                  <View style={styles.team}>
                    <View style={styles.logo} />
                    <View style={[styles.bar, { width: 140, height: 14, flexShrink: 1 }]} />
                  </View>
                  <View style={styles.team}>
                    <View style={styles.logo} />
                    <View style={[styles.bar, { width: 112, height: 14, flexShrink: 1 }]} />
                  </View>
                </View>
                <View style={styles.scores}>
                  <View style={[styles.bar, { width: 14, height: 14 }]} />
                  <View style={[styles.bar, { width: 14, height: 14 }]} />
                </View>
              </View>
            ))}
          </View>
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  // index.tsx styles.list ile aynı kenar: iskelet ve gerçek liste aynı x'te başlar
  list: { paddingHorizontal: space(4) },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: space(3),
    paddingBottom: space(2), // gerçek listedeki leagueFooter yüksekliği
  },
  header: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(2),
    paddingHorizontal: space(4),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  row: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(3),
    paddingVertical: space(3),
    paddingHorizontal: space(4),
  },
  rowSep: { borderTopWidth: 1, borderTopColor: colors.border },
  teams: { flex: 1, minWidth: 0, gap: 10 },
  team: { flexDirection: 'row', alignItems: 'center', gap: space(2) },
  logo: { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.surfaceAlt },
  scores: { gap: 10, alignItems: 'flex-end' },
  bar: { backgroundColor: colors.surfaceAlt, borderRadius: radius.sm },
});
