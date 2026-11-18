import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, hit, radius, space } from '@/theme';
import { maxFontScale } from './ui';

export type TabItem<K extends string> = { key: K; label: string; pro?: boolean };

export function SegmentedTabs<K extends string>({
  items,
  value,
  onChange,
}: {
  items: TabItem<K>[];
  value: K;
  onChange: (k: K) => void;
}) {
  return (
    <View style={styles.wrap} accessibilityRole="tablist">
      {items.map((it) => {
        const active = it.key === value;
        return (
          <Pressable
            key={it.key}
            accessibilityRole="tab"
            // "✦" ekran okuyucuda anlamsız: Pro bilgisi etikete yazılır (Döngü 5, bulgu 3)
            accessibilityLabel={it.pro ? `${it.label}, Pro` : it.label}
            accessibilityState={{ selected: active }}
            onPress={() => onChange(it.key)}
            // 40 pt sekme + dikey hitSlop = 44 pt dokunma alanı (Döngü 4, bulgu 10)
            hitSlop={TAB_SLOP}
            style={[styles.tab, active && (it.pro ? styles.activePro : styles.active)]}
          >
            {/* Büyük yazıda 360 pt'de "✦ AI Tak…" kırpılmasın: 2 satıra kadar (Döngü 5, bulgu 3). Ölçek en fazla
                ×1,2 (tasarım tur 3 T3-2): ×1,3'te yalnız en uzun etiket kırılır, diğerleri tek satırda hizalı kalır */}
            <Text
              style={[styles.text, active && { color: it.pro ? colors.pro : colors.text }]}
              numberOfLines={2}
              {...maxFontScale(1.2)}
            >
              {it.pro ? '✦ ' : ''}
              {it.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const TAB_H = 40;
const TAB_SLOP = { top: (hit - TAB_H) / 2, bottom: (hit - TAB_H) / 2 };

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tab: { flex: 1, minHeight: TAB_H, paddingVertical: space(2), alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm },
  active: { backgroundColor: colors.surfaceAlt },
  activePro: { backgroundColor: colors.proGlow },
  text: { color: colors.textMuted, fontWeight: '700', fontSize: 13, textAlign: 'center' },
});
