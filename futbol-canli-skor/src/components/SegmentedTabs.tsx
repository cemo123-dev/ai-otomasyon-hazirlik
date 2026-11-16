import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, space } from '@/theme';

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
            accessibilityState={{ selected: active }}
            onPress={() => onChange(it.key)}
            style={[styles.tab, active && (it.pro ? styles.activePro : styles.active)]}
          >
            <Text style={[styles.text, active && { color: it.pro ? colors.pro : colors.text }]} numberOfLines={1}>
              {it.pro ? '✦ ' : ''}
              {it.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tab: { flex: 1, paddingVertical: space(2.5), alignItems: 'center', borderRadius: radius.sm },
  active: { backgroundColor: colors.surfaceAlt },
  activePro: { backgroundColor: colors.proGlow },
  text: { color: colors.textMuted, fontWeight: '700', fontSize: 13 },
});
