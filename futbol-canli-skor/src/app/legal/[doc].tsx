import { Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { LEGAL_DOCS, type LegalKey } from '@/lib/legal';
import { colors, space } from '@/theme';

/** Gizlilik Politikası / KVKK Aydınlatma Metni */
export default function LegalScreen() {
  const { doc } = useLocalSearchParams<{ doc: string }>();
  const d = LEGAL_DOCS[(doc as LegalKey) in LEGAL_DOCS ? (doc as LegalKey) : 'privacy'];
  return (
    <>
      <Stack.Screen options={{ title: d.title }} />
      <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={styles.content}>
        {d.sections.map((s) => (
          <View key={s.h} style={{ gap: space(1.5) }}>
            <Text style={styles.h}>{s.h}</Text>
            <Text style={styles.p}>{s.p}</Text>
          </View>
        ))}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: space(4), gap: space(5), paddingBottom: space(16), width: '100%', maxWidth: 720, alignSelf: 'center' },
  h: { color: colors.text, fontWeight: '800', fontSize: 16 },
  p: { color: colors.textMuted, fontSize: 14, lineHeight: 21 },
});
