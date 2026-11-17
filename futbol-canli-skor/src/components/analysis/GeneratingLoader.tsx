import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { colors, radius, space } from '@/theme';
import { Card, useNativeDriver } from '../ui';

const STEPS = [
  'Maç olayları ve istatistikler okunuyor…',
  'xG ve şut kalitesi taranıyor…',
  'Skor durumu kırılma anları analiz ediliyor…',
  'Teknik direktör hamlelerinin etkisi ölçülüyor…',
  'Taktik rapor derleniyor…',
];
const STEP_MS = 1600;

/** Maç öncesi AI için adımlar */
export const PREVIEW_STEPS = [
  'İlk 11\'ler ve dizilişler okunuyor…',
  'Son 5 maç formu ve xG trendi taranıyor…',
  'Bek ↔ kanat eşleşmeleri hesaplanıyor…',
  'Eksik oyuncular kontrol ediliyor…',
  'Kırılma senaryosu kuruluyor…',
];

/** Aşamalı yükleme animasyonu; son adımda Realtime "completed" sinyalini bekler */
export function GeneratingLoader({ steps = STEPS, title = 'AI taktik analizi hazırlanıyor' }: { steps?: string[]; title?: string } = {}) {
  const STEPS = steps;
  const [step, setStep] = useState(0);
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const t = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), STEP_MS);
    const loop = Animated.loop(
      Animated.timing(pulse, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver }),
    );
    loop.start();
    return () => {
      clearInterval(t);
      loop.stop();
    };
  }, [pulse, STEPS.length]);

  const scale = pulse.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.25, 1] });
  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <Card accent={colors.pro}>
      <View style={styles.head}>
        <Animated.View style={[styles.orb, { transform: [{ scale }] }]} />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.sub}>Bu maç için ilk kez üretiliyor. Hazır olunca otomatik açılacak.</Text>
        </View>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress}%` }]} />
      </View>
      <View style={{ gap: space(2) }}>
        {STEPS.map((s, i) => {
          const done = i < step;
          const current = i === step;
          return (
            <View key={s} style={styles.stepRow}>
              <Text style={[styles.stepIcon, done && { color: colors.live }, current && { color: colors.pro }]}>
                {done ? '✓' : current ? '◉' : '○'}
              </Text>
              <Text style={[styles.step, (done || current) && { color: colors.text }, current && { fontWeight: '800' }]}>
                {s}
              </Text>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: space(3) },
  orb: { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.pro, shadowColor: colors.pro, shadowOpacity: 0.8, shadowRadius: 10 },
  title: { color: colors.text, fontWeight: '800', fontSize: 16 },
  sub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  track: { height: 4, backgroundColor: colors.surfaceAlt, borderRadius: radius.sm, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.pro },
  stepRow: { flexDirection: 'row', gap: space(2), alignItems: 'center' },
  stepIcon: { width: 16, color: colors.textDim, fontWeight: '900' },
  step: { color: colors.textDim, fontSize: 13 },
});
