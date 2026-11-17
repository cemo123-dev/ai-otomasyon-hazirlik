import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAssistant } from '@/hooks/useAssistant';
import { ASSISTANT_QUESTION_LIMIT, type Match } from '@/lib/types';
import { colors, radius, space } from '@/theme';
import { Card, CardTitle } from '../ui';

const CHIPS: Record<Match['sport_type'], string[]> = {
  football: ['Maçın kırılma anı neydi?', 'Teknik direktör hamleleri işe yaradı mı?', 'Rövanş için kim avantajlı?'],
  nba: ['Maç hangi çeyrekte koptu?', 'Bench farkı nasıl oluştu?', 'Şut verimliliği sonucu nasıl etkiledi?'],
};

const MAX_LEN = 200;

const PLACEHOLDER: Record<Match['sport_type'], string> = {
  football: 'Örn: Neden 70. dakikada forvet çıktı?',
  nba: 'Örn: Son çeyrekte fark neden kapanmadı?',
};

/** Pro analiz ekranının altında: yalnız bu maça kilitli, 3 soruluk mini sohbet */
export function AssistantChat({ match }: { match: Match }) {
  const { messages, ask, sending, pending, error, remaining } = useAssistant(match.fixture_id);
  const [text, setText] = useState('');
  const asked = new Set(messages.map((m) => m.question));
  const disabled = sending || pending || remaining === 0;

  const send = async (q: string) => {
    const question = q.trim();
    if (question.length < 3 || disabled) return;
    setText('');
    await ask(question);
  };

  return (
    <Card accent={colors.pro}>
      <CardTitle
        kicker="Taktik Asistana Sor"
        title="Bu maç hakkında sor"
        right={<Text style={styles.counter}>{remaining}/{ASSISTANT_QUESTION_LIMIT} soru</Text>}
      />

      {messages.map((m) => (
        <View key={m.id} style={styles.pair}>
          <View style={styles.q}>
            <Text style={styles.qText}>{m.question}</Text>
          </View>
          {m.status === 'pending' ? (
            <View style={styles.a}>
              <ActivityIndicator color={colors.pro} size="small" />
              <Text style={styles.muted}>Maç verisine bakılıyor…</Text>
            </View>
          ) : (
            <View style={[styles.a, m.status === 'failed' && styles.aFailed]}>
              <Text style={m.status === 'failed' ? styles.muted : styles.aText}>{m.answer}</Text>
            </View>
          )}
        </View>
      ))}

      {remaining > 0 ? (
        <>
          <View style={styles.chips}>
            {CHIPS[match.sport_type]
              .filter((c) => !asked.has(c))
              .map((c) => (
                <Pressable
                  key={c}
                  accessibilityRole="button"
                  disabled={disabled}
                  onPress={() => send(c)}
                  style={({ pressed }) => [styles.chip, (pressed || disabled) && { opacity: 0.6 }]}
                >
                  <Text style={styles.chipText}>{c}</Text>
                </Pressable>
              ))}
          </View>
          <View style={styles.inputRow}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder={PLACEHOLDER[match.sport_type]}
              placeholderTextColor={colors.textDim}
              maxLength={MAX_LEN}
              editable={!disabled}
              onSubmitEditing={() => send(text)}
              returnKeyType="send"
              style={styles.input}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Soruyu gönder"
              disabled={disabled || text.trim().length < 3}
              onPress={() => send(text)}
              style={({ pressed }) => [styles.send, (disabled || text.trim().length < 3) && { opacity: 0.4 }, pressed && { opacity: 0.8 }]}
            >
              {sending ? <ActivityIndicator color={colors.bg} size="small" /> : <Text style={styles.sendText}>Sor</Text>}
            </Pressable>
          </View>
        </>
      ) : (
        <Text style={styles.muted}>Bu maç için soru hakkın doldu. Yanıtlar yalnız bu maçın verisine dayanır.</Text>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  counter: { color: colors.pro, fontWeight: '800', fontSize: 12 },
  pair: { gap: space(1.5) },
  q: { alignSelf: 'flex-end', maxWidth: '85%', backgroundColor: colors.surfaceAlt, borderRadius: radius.md, paddingHorizontal: space(3), paddingVertical: space(2) },
  qText: { color: colors.text, fontSize: 14, fontWeight: '600' },
  a: { flexDirection: 'row', alignItems: 'center', gap: space(2), alignSelf: 'flex-start', maxWidth: '92%', backgroundColor: colors.proGlow, borderRadius: radius.md, paddingHorizontal: space(3), paddingVertical: space(2) },
  aFailed: { backgroundColor: colors.surfaceAlt },
  aText: { color: colors.text, fontSize: 14, lineHeight: 20, flexShrink: 1 },
  muted: { color: colors.textMuted, fontSize: 13, lineHeight: 19, flexShrink: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space(2) },
  chip: { borderWidth: 1, borderColor: colors.pro, borderRadius: 999, paddingHorizontal: space(3), paddingVertical: space(1.5) },
  chipText: { color: colors.pro, fontSize: 12, fontWeight: '700' },
  inputRow: { flexDirection: 'row', gap: space(2), alignItems: 'center' },
  input: { flex: 1, color: colors.text, backgroundColor: colors.surfaceAlt, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: space(3), paddingVertical: space(2.5), fontSize: 14 },
  send: { backgroundColor: colors.pro, borderRadius: radius.md, paddingHorizontal: space(4), paddingVertical: space(2.5), minWidth: 56, alignItems: 'center' },
  sendText: { color: colors.bg, fontWeight: '900', fontSize: 14 },
  error: { color: colors.danger, fontSize: 12 },
});
