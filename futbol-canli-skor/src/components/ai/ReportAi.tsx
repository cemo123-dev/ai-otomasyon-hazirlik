import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { dataSource } from '@/lib/data';
import { friendlyError } from '@/lib/errors';
import { AI_REPORT_NOTE_MAX, type AiReportReason, type AiReportResult, type AiSurface } from '@/lib/types';
import { colors, hit, radius, space } from '@/theme';
import { useReduceMotion } from '../ui';

/**
 * F7 "Hata bildir" (docs/inovasyon-onerileri.md F7; pazarlama Sürüm 3: Play üretken AI içerik politikası —
 * kullanıcı rahatsız edici / yanlış AI içeriğini uygulamadan çıkmadan bildirebilmeli).
 * Her AI yüzeyinde (maç sonu futbol + NBA, maç önü, devre arası, asistan yanıtı, kırmızı kart analizi)
 * küçük bir bağlantı → alttan açılan sayfa: neden (4 seçenek) + isteğe bağlı 200 karakterlik not.
 * Sunucu: report_ai_output RPC (0020_ai_reports.sql; günde 20 bildirim, istemci okuyamaz).
 */

const REASONS: { key: AiReportReason; label: string }[] = [
  { key: 'wrong_info', label: 'Yanlış bilgi' },
  { key: 'inappropriate', label: 'Uygunsuz içerik' },
  { key: 'sport_mixup', label: 'Futbol-basketbol terimi karışık' },
  { key: 'other', label: 'Diğer' },
];

const RESULT_TEXT: Record<Exclude<AiReportResult, 'ok'>, string> = {
  rate_limited: 'Bugün için bildirim sınırına ulaştın. Yarın yeniden bildirebilirsin.',
  unavailable: 'Bildirim şu an alınamıyor. Daha sonra tekrar dene.',
  invalid: 'Bildirim gönderilemedi. Bir neden seçip tekrar dene.',
  unauthenticated: 'Oturum açılamadı. İnternet bağlantını kontrol edip tekrar dene.',
};

// Oturum boyunca "Bildirildi" durumu (sekme değişince bileşen yeniden kurulsa da korunur)
const reported = new Set<string>();
const refKey = (fixtureId: number, surface: AiSurface, itemRef: string | null) => `${fixtureId}:${surface}:${itemRef ?? ''}`;

type Props = { fixtureId: number; surface: AiSurface; itemRef?: string | null; style?: TextStyle };

/** Küçük metin bağlantısı (dokunma alanı 44); gönderildikten sonra "✓ Bildirildi" (pasif) */
export function ReportAiButton({ fixtureId, surface, itemRef = null, style }: Props) {
  const key = refKey(fixtureId, surface, itemRef);
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(() => reported.has(key));
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={done ? 'Hata bildirildi' : 'Hata bildir'}
        accessibilityHint="Bu yapay zekâ içeriğindeki hatayı veya uygunsuz ifadeyi bildirir"
        accessibilityState={{ disabled: done }}
        disabled={done}
        hitSlop={{ top: 6, bottom: 6 }}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.link, pressed && { opacity: 0.7 }]}
      >
        <Text style={[styles.linkText, done && { color: colors.textMuted }, style]}>{done ? '✓ Bildirildi' : '⚑ Hata bildir'}</Text>
      </Pressable>
      {open ? (
        <ReportAiSheet
          fixtureId={fixtureId}
          surface={surface}
          itemRef={itemRef}
          onClose={() => setOpen(false)}
          onSent={() => {
            reported.add(key);
            setDone(true);
          }}
        />
      ) : null}
    </>
  );
}

/** AI raporunun sonundaki tek satır: etiket + "Hata bildir" (tasarım §3.9) */
export function AiFooter({
  fixtureId,
  surface,
  center,
  inset,
}: {
  fixtureId: number;
  surface: AiSurface;
  center?: boolean;
  /** Kart iç boşluğu kadar içeriden (kart içi metinle aynı hiza) */
  inset?: boolean;
}) {
  return (
    <View style={[styles.footer, center && { justifyContent: 'center' }, inset && { paddingHorizontal: space(4) }]}>
      <Text style={[styles.note, center && { textAlign: 'center' }]}>✦ AI tarafından üretildi, maç verisine dayanır.</Text>
      <ReportAiButton fixtureId={fixtureId} surface={surface} />
    </View>
  );
}

function ReportAiSheet({
  fixtureId,
  surface,
  itemRef,
  onClose,
  onSent,
}: {
  fixtureId: number;
  surface: AiSurface;
  itemRef: string | null;
  onClose: () => void;
  onSent: () => void;
}) {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const [reason, setReason] = useState<AiReportReason | null>(null);
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<AiReportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    if (!reason || sending) return;
    setSending(true);
    setError(null);
    try {
      const r = await dataSource.reportAiOutput({ fixtureId, surface, itemRef, reason, note: note.trim() || null });
      setResult(r);
      if (r === 'ok') onSent();
    } catch (e) {
      // Ağ hatası: form ve yazılan not korunur
      setError(friendlyError(e, 'Bildirim gönderilemedi. Tekrar dene.'));
    } finally {
      setSending(false);
    }
  };

  const finished = result === 'ok' || result === 'rate_limited' || result === 'unavailable';

  return (
    <Modal transparent visible animationType={reduceMotion || Platform.OS === 'web' ? 'none' : 'slide'} onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={StyleSheet.absoluteFill} accessibilityLabel="Sayfayı kapat" accessibilityRole="button" onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: space(4) + insets.bottom }]} accessibilityViewIsModal>
          <ScrollView contentContainerStyle={{ gap: space(3) }} keyboardShouldPersistTaps="handled">
            <Text style={styles.title} accessibilityRole="header">
              Hata bildir
            </Text>
            {finished ? (
              <>
                <Text style={styles.body}>
                  {result === 'ok' ? 'Teşekkürler. Bildirimin bize ulaştı; bu içeriği inceleyeceğiz.' : RESULT_TEXT[result as Exclude<AiReportResult, 'ok'>]}
                </Text>
                <Pressable accessibilityRole="button" onPress={onClose} style={({ pressed }) => [styles.primary, pressed && { opacity: 0.85 }]}>
                  <Text style={styles.primaryText}>Kapat</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.body}>Bu AI içeriğinde ne sorunlu?</Text>
                <View accessibilityRole="radiogroup" style={{ gap: space(2) }}>
                  {REASONS.map((r) => {
                    const on = reason === r.key;
                    return (
                      <Pressable
                        key={r.key}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: on }}
                        aria-checked={on}
                        accessibilityLabel={r.label}
                        onPress={() => setReason(r.key)}
                        style={({ pressed }) => [styles.option, on && styles.optionOn, pressed && { opacity: 0.8 }]}
                      >
                        <View style={[styles.radio, on && styles.radioOn]}>{on ? <View style={styles.radioDot} /> : null}</View>
                        <Text style={styles.optionText}>{r.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
                <TextInput
                  value={note}
                  onChangeText={setNote}
                  maxLength={AI_REPORT_NOTE_MAX}
                  multiline
                  placeholder="İstersen kısaca açıkla (isteğe bağlı)"
                  placeholderTextColor={colors.textDim}
                  accessibilityLabel="Not, isteğe bağlı"
                  style={styles.input}
                />
                <Text style={styles.caption}>
                  {note.length}/{AI_REPORT_NOTE_MAX} · Kişisel bilgi yazma. Bildirimler 90 gün sonra silinir.
                </Text>
                {result && !finished ? <Text style={styles.error}>{RESULT_TEXT[result as Exclude<AiReportResult, 'ok'>]}</Text> : null}
                {error ? <Text style={styles.error}>{error}</Text> : null}
                <View style={styles.actions}>
                  <Pressable accessibilityRole="button" onPress={onClose} style={({ pressed }) => [styles.secondary, pressed && { opacity: 0.8 }]}>
                    <Text style={styles.secondaryText}>Vazgeç</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Bildirimi gönder"
                    accessibilityState={{ disabled: !reason || sending, busy: sending }}
                    disabled={!reason || sending}
                    onPress={send}
                    style={({ pressed }) => [styles.primary, { flex: 1 }, (!reason || sending) && { opacity: 0.4 }, pressed && { opacity: 0.85 }]}
                  >
                    {sending ? <ActivityIndicator color={colors.onFill} /> : <Text style={styles.primaryText}>Gönder</Text>}
                  </Pressable>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  footer: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: space(2) },
  note: { color: colors.textMuted, fontSize: 12, lineHeight: 17, flexShrink: 1 },
  link: { minHeight: hit, justifyContent: 'center', alignSelf: 'flex-start' },
  linkText: { color: colors.accent, fontSize: 13, lineHeight: 18, fontWeight: '700' },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    maxHeight: '90%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: space(4),
    paddingTop: space(5),
  },
  title: { color: colors.text, fontSize: 17, lineHeight: 22, fontWeight: '800' },
  body: { color: colors.text, fontSize: 14, lineHeight: 20 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(3),
    minHeight: 48,
    paddingHorizontal: space(3),
    paddingVertical: space(2),
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceAlt,
  },
  optionOn: { borderColor: colors.accent },
  optionText: { color: colors.text, fontSize: 14, lineHeight: 20, fontWeight: '600', flexShrink: 1 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  radioOn: { borderColor: colors.accent },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent },
  input: {
    minHeight: 72,
    color: colors.text,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: space(3),
    paddingVertical: space(2),
    fontSize: 14,
    textAlignVertical: 'top',
  },
  caption: { color: colors.textMuted, fontSize: 12, lineHeight: 17 },
  error: { color: colors.danger, fontSize: 13, lineHeight: 18 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: space(2) },
  primary: { minHeight: 48, borderRadius: radius.md, backgroundColor: colors.live, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space(4) },
  primaryText: { color: colors.onFill, fontSize: 15, fontWeight: '800' },
  secondary: { minHeight: 48, borderRadius: radius.md, backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space(4) },
  secondaryText: { color: colors.text, fontSize: 14, fontWeight: '700' },
});
