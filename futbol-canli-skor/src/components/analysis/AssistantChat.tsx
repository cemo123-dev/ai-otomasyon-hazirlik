import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAssistant } from '@/hooks/useAssistant';
import { ASSISTANT_QUESTION_LIMIT, type Match } from '@/lib/types';
import { colors, hit, radius, space } from '@/theme';
import { ReportAiButton } from '../ai/ReportAi';
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
    // Yazılan soru yalnız gönderim başarılıysa silinir (busy / invalid / ağ hatasında kaybolmasın)
    const ok = await ask(question);
    if (ok) setText((cur) => (cur.trim() === question ? '' : cur));
  };

  return (
    <Card accent={colors.pro}>
      <CardTitle
        kicker="TAKTİK ASİSTANA SOR"
        title="Bu maç hakkında sor"
        // Tasarım tur 2 R-4: "0/3" iki türlü okunuyordu; kalan hak açıkça yazılır
        right={
          remaining > 0 ? (
            <Text style={styles.counter}>
              Kalan: {remaining}/{ASSISTANT_QUESTION_LIMIT}
            </Text>
          ) : (
            <Text style={[styles.counter, { color: colors.textMuted }]}>Hak doldu</Text>
          )
        }
      />

      {messages.map((m) => (
        <View key={m.id} style={styles.pair}>
          <View style={styles.q}>
            <Text style={styles.qText}>{m.question}</Text>
          </View>
          {/* AI balonu: üstte "✦ AI" etiketi; proGlow zeminde yalnız text rengi (textMuted 4.45:1 kalır) */}
          {m.status === 'pending' ? (
            <View style={styles.aWrap}>
              <Text style={styles.aLabel}>✦ AI</Text>
              <View style={[styles.a, styles.aRow]}>
                <ActivityIndicator color={colors.pro} size="small" />
                <Text style={styles.aText}>Maç verisine bakılıyor…</Text>
              </View>
            </View>
          ) : (
            <View style={styles.aWrap}>
              <Text style={styles.aLabel}>✦ AI</Text>
              <View style={[styles.a, m.status === 'failed' && styles.aFailed]}>
                <Text style={m.status === 'failed' ? styles.failText : styles.aText}>{m.answer}</Text>
              </View>
              {/* F7: her AI yanıtının altında "Hata bildir" (hata/doğrulanamadı yanıtında değil) */}
              {m.status === 'answered' ? <ReportAiButton fixtureId={match.fixture_id} surface="assistant" itemRef={String(m.id)} /> : null}
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
              {sending ? <ActivityIndicator color={colors.onFill} size="small" /> : <Text style={styles.sendText}>Sor</Text>}
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
  counter: { color: colors.pro, fontWeight: '800', fontSize: 13 },
  pair: { gap: space(1.5) },
  // Kullanıcı balonu: sağa yaslı, belirgin kenar, sağ alt köşe 4
  q: {
    alignSelf: 'flex-end',
    maxWidth: '85%',
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    borderBottomRightRadius: 4,
    paddingHorizontal: space(3),
    paddingVertical: space(2),
  },
  qText: { color: colors.text, fontSize: 14, lineHeight: 20, fontWeight: '600' },
  aWrap: { alignSelf: 'flex-start', maxWidth: '92%', gap: 2 },
  aLabel: { color: colors.pro, fontSize: 11, lineHeight: 15, fontWeight: '700', letterSpacing: 1.1 },
  // AI balonu: sola yaslı, sol alt köşe 4
  a: {
    backgroundColor: colors.proGlow,
    borderRadius: radius.md,
    borderBottomLeftRadius: 4,
    paddingHorizontal: space(3),
    paddingVertical: space(2),
  },
  aRow: { flexDirection: 'row', alignItems: 'center', gap: space(2) },
  aFailed: { backgroundColor: colors.surfaceAlt },
  failText: { color: colors.danger, fontSize: 12, lineHeight: 17, flexShrink: 1 },
  aText: { color: colors.text, fontSize: 14, lineHeight: 20, flexShrink: 1 },
  muted: { color: colors.textMuted, fontSize: 13, lineHeight: 19, flexShrink: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space(2) },
  chip: { minHeight: hit, justifyContent: 'center', borderWidth: 1, borderColor: colors.pro, borderRadius: radius.pill, paddingHorizontal: space(3), paddingVertical: space(1.5) },
  chipText: { color: colors.pro, fontSize: 12, fontWeight: '700' },
  inputRow: { flexDirection: 'row', gap: space(2), alignItems: 'center' },
  input: { flex: 1, color: colors.text, backgroundColor: colors.surfaceAlt, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: space(3), paddingVertical: space(2.5), fontSize: 14 },
  send: { backgroundColor: colors.pro, borderRadius: radius.md, paddingHorizontal: space(4), minHeight: 44, minWidth: 56, alignItems: 'center', justifyContent: 'center' },
  sendText: { color: colors.onFill, fontWeight: '900', fontSize: 14 },
  error: { color: colors.danger, fontSize: 12 },
});
