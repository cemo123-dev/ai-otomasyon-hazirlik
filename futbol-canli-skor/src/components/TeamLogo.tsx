import { memo, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme';

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toLocaleUpperCase('tr'))
    .join('');

/** Takım logosu; logo yoksa veya yüklenemezse baş harf rozeti */
function TeamLogoBase({ uri, name, size = 20 }: { uri?: string | null; name: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  const box = { width: size, height: size, borderRadius: size / 2 };
  if (!uri || failed) {
    return (
      <View style={[styles.fallback, box]} accessibilityElementsHidden>
        <Text style={[styles.initials, { fontSize: size * 0.4 }]}>{initials(name)}</Text>
      </View>
    );
  }
  return (
    <Image
      source={{ uri }}
      style={{ width: size, height: size }}
      resizeMode="contain"
      onError={() => setFailed(true)}
      accessibilityIgnoresInvertColors
    />
  );
}

export const TeamLogo = memo(TeamLogoBase);

const styles = StyleSheet.create({
  fallback: { backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  initials: { color: colors.textMuted, fontWeight: '800' },
});
