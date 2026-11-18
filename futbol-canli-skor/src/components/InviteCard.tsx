import { useState } from 'react';
import { ActivityIndicator, Pressable, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { useInvite, type RedeemOutcome } from '@/hooks/useInvite';
import { getDownloadUrl } from '@/lib/growth';
import { buildInviteText, groupInviteCode, hasForeignInviteChar, isValidInviteCode, normalizeInviteInput } from '@/lib/share';
import { colors, font, radius, space, type } from '@/theme';
import { Card, CardTitle, InfoStrip } from './ui';

const TONE_COLOR: Record<RedeemOutcome['tone'], string> = { ok: colors.live, error: colors.danger, info: colors.textMuted };

/**
 * F3 Ayarlar davet kartı (tasarım tur 2 §D-2). Davet Pro özelliği değil: altın renk yok.
 * Kartta olmayacaklar: kopyala düğmesi (expo-clipboard yok; kod `selectable`), "ücretsiz Pro", süre, fiyat, ödül.
 */
export function InviteCard() {
  const downloadUrl = getDownloadUrl();
  const { invite, loading, error, redeem, reload } = useInvite();
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<RedeemOutcome | null>(null);
  const [closed, setClosed] = useState(false);
  const [blocked, setBlocked] = useState(false);

  // İndirme adresi yok ya da 0017 kurulmadı (RPC yok): kart hiç çizilmez
  if (!downloadUrl) return null;
  if (!loading && !error && !invite) return null;

  if (error) {
    return (
      <Card>
        <CardTitle kicker="DAVET" title="Arkadaşını davet et" />
        <InfoStrip title="Davet bilgisi yüklenemedi" body={error} action="Tekrar dene" actionLabel="Davet bilgisini yeniden yükle" onAction={reload} />
      </Card>
    );
  }

  const ready = !!invite && !loading;
  const code = invite?.code ?? '';
  const active = invite && invite.total >= 3 ? invite.active : null;
  const normalized = normalizeInviteInput(value);
  const canSave = isValidInviteCode(normalized) && !sending && !blocked;
  const showHint = value.trim() !== '' && hasForeignInviteChar(value);

  const sendInvite = async () => {
    if (!ready) return;
    try {
      await Share.share({ message: buildInviteText(downloadUrl, code) });
    } catch {
      /* kullanıcı kapattı / web'de destek yok */
    }
  };

  const save = async () => {
    if (!canSave) return;
    setSending(true);
    const out = await redeem(normalized);
    setSending(false);
    setResult(out);
    if (out.closeInput) setClosed(true);
    if (out.result === 'rate_limited') setBlocked(true); // "Kaydet" pasif kalır
  };

  return (
    <Card>
      <CardTitle kicker="DAVET" title="Arkadaşını davet et" />

      <View
        style={styles.codeBox}
        accessible
        accessibilityLabel={ready ? `Davet kodun ${code.split('').join(' ')}` : 'Davet kodun yükleniyor'}
      >
        <Text style={styles.codeLabel}>Davet kodun</Text>
        <Text style={[styles.code, !ready && { color: colors.textDim }]} selectable maxFontSizeMultiplier={1.3}>
          {ready ? groupInviteCode(code) : '— — —'}
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !ready }}
        disabled={!ready}
        onPress={sendInvite}
        style={({ pressed }) => [styles.primary, !ready && { opacity: 0.4 }, pressed && { opacity: 0.85 }]}
      >
        <Text style={styles.primaryText}>Davetiye gönder</Text>
      </Pressable>

      <View style={{ gap: space(2) }}>
        {/* KVKK (Döngü 6 bulgu 5): "Aktif olan" yalnız 3+ davetli varken; tek davetlinin kullanımı sayaçtan okunmaz */}
        {ready && active == null ? (
          <Text style={styles.counter}>
            Davetinle gelen: <Text style={font.mono}>{invite!.total}</Text>
          </Text>
        ) : (
          <Text style={styles.counter}>
            Davetinle gelen: <Text style={font.mono}>{ready ? invite!.total : '—'}</Text> · Aktif olan:{' '}
            <Text style={font.mono}>{ready ? active : '—'}</Text>
          </Text>
        )}
        {!ready || active != null ? (
          <View style={styles.dots} accessible={false} importantForAccessibility="no-hide-descendants">
            {[0, 1, 2].map((i) => (
              <View key={i} style={[styles.dot, { backgroundColor: ready && active != null && i < active ? colors.live : colors.borderStrong }]} />
            ))}
          </View>
        ) : null}
      </View>

      <View style={{ gap: 2 }}>
        <Text style={styles.caption}>Aktif 3 davet → Pro satışa açılmadan önce denemeye davet edilirsin.</Text>
        <Text style={styles.caption}>Aktif: kodu girdikten sonra uygulamayı en az bir gün arayla 2 farklı gün açan davetli.</Text>
        {ready && active == null ? (
          <Text style={styles.caption}>Aktif sayısı, davetinle en az 3 kişi gelince görünür.</Text>
        ) : null}
      </View>

      {ready && (invite!.canRedeem || result) ? (
        <View style={styles.redeem}>
          {invite!.canRedeem && !closed ? (
            <>
              <Text style={styles.redeemTitle}>Davet kodun var mı?</Text>
              <View style={styles.inputRow}>
                <TextInput
                  value={value}
                  onChangeText={(t) => {
                    setValue(t);
                    if (result && !result.ok) setResult(null);
                  }}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  onSubmitEditing={save}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  autoComplete="off"
                  maxLength={8}
                  placeholder="ABC234"
                  placeholderTextColor={colors.textDim}
                  accessibilityLabel="Davet kodu"
                  style={[styles.input, focused && { borderColor: colors.accent }]}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !canSave }}
                  disabled={!canSave}
                  onPress={save}
                  style={[styles.secondary, !canSave && !sending && { opacity: 0.4 }]}
                >
                  {sending ? <ActivityIndicator color={colors.text} size="small" /> : <Text style={styles.secondaryText}>Kaydet</Text>}
                </Pressable>
              </View>
              {showHint ? <Text style={styles.caption}>Kodlarda 0, 1, I, L ve O harfi yoktur.</Text> : null}
            </>
          ) : null}
          {result ? (
            <Text style={[styles.result, { color: TONE_COLOR[result.tone] }]} accessibilityLiveRegion="polite">
              {result.text}
            </Text>
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  codeBox: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    paddingVertical: space(4),
    alignItems: 'center',
    gap: space(1),
  },
  codeLabel: { ...type.caption, color: colors.textMuted },
  code: { ...type.title1, ...font.mono, letterSpacing: 4, color: colors.text },
  primary: {
    minHeight: 48,
    borderRadius: radius.md,
    backgroundColor: colors.live,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space(4),
  },
  primaryText: { color: colors.onFill, fontSize: 15, fontWeight: '800' },
  counter: { ...type.label, color: colors.text },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  caption: { ...type.caption, color: colors.textMuted },
  redeem: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: space(3), gap: space(2) },
  redeemTitle: { ...type.headline, color: colors.text },
  inputRow: { flexDirection: 'row', gap: space(2), alignItems: 'center' },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: 44,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingHorizontal: space(3),
    ...font.mono,
    fontSize: 16,
    letterSpacing: 2,
    color: colors.text,
  },
  secondary: {
    minWidth: 88,
    minHeight: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space(3),
  },
  secondaryText: { color: colors.text, fontSize: 14, fontWeight: '700' },
  result: { ...type.caption },
});
