import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Share, Text, View } from 'react-native';
import { loadInviteCode } from '@/hooks/useInvite';
import { getDownloadUrl } from '@/lib/growth';
import { buildShareText, type ShareMatch } from '@/lib/share';
import { colors, hit, space } from '@/theme';

/** Paylaş'a basınca davet kodu için en fazla bu kadar beklenir; gelmezse bağlantı `k`'sız gider */
const CODE_WAIT_MS = 1500;

/**
 * F3 başlık sağı "Paylaş" (tasarım tur 2 §D-1). Yalnız biten ve başlamamış maçta çizilir; canlı, devre arası,
 * ertelenen / iptal maçta, skoru henüz gelmemiş biten maçta ve indirme adresi tanımlı değilken hiç çizilmez
 * (pasif hâli yok). Maç canlıdan bitmişe geçince `match` değişir ve düğme aynı ekranda belirir.
 *
 * Davet kodu yalnız düğmeye basınca istenir (Döngü 6 bulgu 6–7): maç açılışında `get_my_invite` çağrılmaz,
 * paylaşmayan kullanıcıya kod üretilmez. Basınca kod kısa süre beklenir; erken basışta da `k` kaybolmaz.
 * Bekleme ve paylaşım sayfası açıkken ikinci basış yok sayılır; bekleme boyunca küçük gösterge (Döngü 7 bulgu 11).
 */
export function ShareButton({ match }: { match: ShareMatch }) {
  // Senkron kilit: state güncellemesi gelmeden gelen hızlı ikinci basış da yakalanır
  const busy = useRef(false);
  const [pending, setPending] = useState(false);
  const downloadUrl = getDownloadUrl();
  // Görünürlük: metin üretilebiliyor mu (durum + skor + adres); kod ve saat burada gerekmez (nowMs yalnız
  // "bugün/yarın" etiketini etkiler, null olup olmamayı değil)
  if (!downloadUrl || !buildShareText(match, { downloadUrl, inviteCode: null, nowMs: 0 })) return null;

  const onPress = async () => {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    try {
      const code = await loadInviteCode(CODE_WAIT_MS);
      const message = buildShareText(match, { downloadUrl, inviteCode: code, nowMs: Date.now() });
      setPending(false);
      if (!message) return;
      // Yalnız message: Android url'i yok sayar, iOS'ta metin + bağlantı çift görünürdü
      await Share.share({ message });
    } catch {
      /* kullanıcı kapattı / web'de destek yok: geri bildirim yok */
    } finally {
      busy.current = false;
      setPending(false);
    }
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Maçı paylaş"
      accessibilityState={{ busy: pending }}
      hitSlop={4}
      onPress={onPress}
      style={({ pressed }) => [
        { minWidth: hit, minHeight: hit, justifyContent: 'center', alignItems: 'center', paddingHorizontal: space(2) },
        (pressed || pending) && { opacity: pending ? 0.5 : 0.7 },
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space(1) }}>
        {pending ? <ActivityIndicator size="small" color={colors.accent} /> : null}
        <Text style={{ color: colors.accent, fontSize: 15, fontWeight: '700' }} maxFontSizeMultiplier={1.3}>
          Paylaş
        </Text>
      </View>
    </Pressable>
  );
}
