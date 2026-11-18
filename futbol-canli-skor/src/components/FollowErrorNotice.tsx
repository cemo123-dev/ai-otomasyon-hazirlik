import { StyleSheet, Text, View } from 'react-native';
import { useFollows } from '@/hooks/useFollows';
import { colors, radius, space } from '@/theme';

/** Zil / yıldız dokunuşu başarısızsa kısa uyarı (useFollows birkaç saniye sonra kaldırır) */
export function FollowErrorNotice() {
  const { followError } = useFollows();
  if (!followError) return null;
  return (
    <View style={styles.box} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <Text style={styles.text}>⚠ {followError}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    marginHorizontal: space(4),
    marginBottom: space(3),
    paddingVertical: space(2),
    paddingHorizontal: space(3),
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.warning,
    backgroundColor: 'rgba(255,162,58,0.08)',
  },
  text: { color: colors.warning, fontSize: 13, fontWeight: '700' },
});
