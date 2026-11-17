import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { colors, radius, space } from '@/theme';
import { Card, useNativeDriver } from '../ui';

/**
 * Üretim sırasında gösterilen sade bekleme kartı. Gerçek ilerleme bilinmediği için
 * sahte adım/yüzde göstermez; yalnız AI'ın neye baktığını sırayla anlatır.
 * Tamamlanma Realtime ile gelir ve kart kendiliğinden kapanır.
 */
const HINTS = ['Maç olayları ve istatistikler', 'xG ve şut kalitesi', 'Skor durumu ve kırılma anları', 'Teknik direktör hamleleri'];

/** NBA maç sonu analizinin baktıkları (futbol terimi yok) */
export const NBA_STEPS = ['Kutu skoru ve periyot skorları', 'Şut verimliliği (TS%, üçlük)', 'Kırılma periyodu ve son çeyrek', 'Bench ve rotasyon etkisi'];

/** Maç öncesi AI'ın baktıkları */
export const PREVIEW_STEPS = ["İlk 11'ler ve dizilişler", 'Son 5 maç formu ve xG trendi', 'Bek ↔ kanat eşleşmeleri', 'Eksik oyuncular'];

/** Devre arası raporunun baktıkları */
export const HALFTIME_STEPS = ['İlk yarı istatistikleri', 'Topla oynama ve xG dengesi', 'Şut kalitesi ve kritik olaylar'];

const HINT_MS = 2200;

export function GeneratingLoader({ steps = HINTS, title = 'AI taktik analizi hazırlanıyor' }: { steps?: string[]; title?: string } = {}) {
  const [hint, setHint] = useState(0);
  const [pulse] = useState(() => new Animated.Value(0));
  // Çubuk 'left' ile kayar: native sürücü yerleşim özelliklerini desteklemez → JS sürücüsü
  const [bar] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const t = setInterval(() => setHint((h) => (h + 1) % steps.length), HINT_MS);
    const loop = Animated.loop(
      Animated.timing(pulse, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver }),
    );
    const barLoop = Animated.loop(
      Animated.timing(bar, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
    );
    loop.start();
    barLoop.start();
    return () => {
      clearInterval(t);
      loop.stop();
      barLoop.stop();
    };
  }, [pulse, bar, steps.length]);

  const scale = pulse.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.25, 1] });
  const slide = bar.interpolate({ inputRange: [0, 1], outputRange: ['-40%', '100%'] });

  return (
    <Card accent={colors.pro}>
      <View style={styles.head}>
        <Animated.View style={[styles.orb, { transform: [{ scale }] }]} />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.sub}>Genellikle birkaç saniye sürer; hazır olunca otomatik açılır.</Text>
        </View>
      </View>
      {/* Belirsiz ilerleme çubuğu: gerçek yüzde bilinmiyor */}
      <View style={styles.track}>
        <Animated.View style={[styles.fill, { left: slide }]} />
      </View>
      <Text style={styles.hint} accessibilityLiveRegion="polite">
        Bakılıyor: <Text style={styles.hintStrong}>{steps[hint % steps.length]}</Text>
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: space(3) },
  orb: { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.pro, shadowColor: colors.pro, shadowOpacity: 0.8, shadowRadius: 10 },
  title: { color: colors.text, fontWeight: '800', fontSize: 16 },
  sub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  track: { height: 4, backgroundColor: colors.surfaceAlt, borderRadius: radius.sm, overflow: 'hidden' },
  fill: { position: 'absolute', top: 0, bottom: 0, width: '40%', backgroundColor: colors.pro, borderRadius: radius.sm },
  hint: { color: colors.textMuted, fontSize: 13 },
  hintStrong: { color: colors.text, fontWeight: '700' },
});
