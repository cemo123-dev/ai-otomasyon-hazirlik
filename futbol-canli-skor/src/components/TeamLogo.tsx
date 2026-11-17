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

/**
 * Wikimedia SVG adresini 120 px PNG küçük resmine çevirir (Android Image SVG çizemez).
 * Sunucu yeni kayıtlarda zaten çeviriyor (supabase/functions/_shared/nbaBox.ts); bu, eski kayıtlar için.
 */
const WIKI_SVG = /^(https:\/\/upload\.wikimedia\.org\/wikipedia\/[a-z]+)\/([0-9a-f]\/[0-9a-f]{2})\/([^/?#]+\.svg)$/i;
const toRaster = (u: string) => {
  const m = u.match(WIKI_SVG);
  return m ? `${m[1]}/thumb/${m[2]}/${m[3]}/120px-${m[3]}.png` : u;
};

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
      source={{ uri: toRaster(uri) }}
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
