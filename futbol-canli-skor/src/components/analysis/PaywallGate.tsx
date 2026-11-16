import { BlurTargetView, BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { useRef, type ComponentRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Match, TacticalPayload } from '@/lib/types';
import { colors, radius, space } from '@/theme';
import { Badge, Card } from '../ui';
import { AnalysisReport } from './AnalysisCards';

/**
 * Bulanık arka plan için GERÇEK analiz kullanılmaz (RLS zaten vermez);
 * yalnızca kart yapısını gösteren yer tutucu içerik çizilir.
 */
const PLACEHOLDER: TacticalPayload = {
  headline_title: 'Taktik hüküm burada yer alır',
  executive_tactical_verdict:
    'Maçın taktik özeti, kilit kırılma anları ve takımların oyun planlarının nerede ayrıştığına dair değerlendirme bu kartta yer alır.',
  xg_and_shot_quality_audit: {
    verdict_type: 'balanced_exchange',
    verdict_label: 'Şut kalitesi denetimi',
    home: { xg: 0, shots: 0, xg_per_shot: 0.1, shots_on_target: 1, shots_inside_box: 1 },
    away: { xg: 0, shots: 0, xg_per_shot: 0.1, shots_on_target: 1, shots_inside_box: 1 },
    commentary: 'Şut kalitesi ve fırsat üretimi değerlendirmesi.',
  },
  game_state_and_momentum_shifts: [
    { minute: 0, score_state: '', title: 'Momentum kırılması', description: 'Oyun durumunun değiştiği an.', momentum: 'neutral' },
    { minute: 0, score_state: '', title: 'Momentum kırılması', description: 'Oyun durumunun değiştiği an.', momentum: 'neutral' },
  ],
  managerial_and_bench_impact: {
    home: { manager: 'Teknik direktör', delta: 0, key_decision: '—', commentary: 'Değişikliklerin etkisi.' },
    away: { manager: 'Teknik direktör', delta: 0, key_decision: '—', commentary: 'Değişikliklerin etkisi.' },
  },
  player_performance_spotlight: {
    player: 'Maçın yıldızı',
    team: 'home',
    position: '—',
    rating: 0,
    headline: 'Oyuncu performans özeti.',
    key_stats: [
      { label: '—', value: '•' },
      { label: '—', value: '•' },
    ],
  },
};

export function PaywallGate({ match }: { match: Match }) {
  const target = useRef<ComponentRef<typeof View>>(null);

  return (
    <View style={{ gap: space(3) }}>
      {/* Ücretsiz teaser: açık gösterilir */}
      <Card>
        <Badge label="ÜCRETSİZ ÖZET" color={colors.live} />
        <Text style={styles.teaser}>
          {match.summary_teaser ?? 'Bu maçın kısa özeti henüz hazır değil.'}
        </Text>
      </Card>

      {/* Derin analiz: bulanık */}
      <View style={styles.lockedWrap}>
        <BlurTargetView ref={target} style={styles.lockedContent} pointerEvents="none">
          <AnalysisReport p={PLACEHOLDER} match={match} />
        </BlurTargetView>
        <BlurView
          blurTarget={target}
          intensity={40}
          tint="dark"
          blurMethod="dimezisBlurViewSdk31Plus"
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.overlay} pointerEvents="box-none">
          <View style={styles.cta}>
            <Text style={styles.lock}>🔒</Text>
            <Text style={styles.ctaTitle}>Derin taktik rapor Pro üyelere özel</Text>
            <Text style={styles.ctaSub}>
              xG denetimi, momentum kırılmaları, teknik direktör etki deltası ve maçın yıldızı.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/paywall')}
              style={({ pressed }) => [styles.button, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.buttonText}>Pro’ya Geçerek Tüm Taktik Analizi Aç</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  teaser: { color: colors.text, fontSize: 15, lineHeight: 22 },
  lockedWrap: { position: 'relative', borderRadius: radius.lg, overflow: 'hidden', maxHeight: 720 },
  lockedContent: { opacity: 0.6 },
  // Blur desteklemeyen eski Android'lerde içerik okunmasın diye ek karartma
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(10,14,20,0.55)',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: space(16),
    paddingHorizontal: space(4),
  },
  cta: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    gap: space(2),
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.pro,
    padding: space(5),
  },
  lock: { fontSize: 26 },
  ctaTitle: { color: colors.text, fontSize: 17, fontWeight: '900', textAlign: 'center' },
  ctaSub: { color: colors.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 19 },
  button: {
    marginTop: space(2),
    backgroundColor: colors.pro,
    borderRadius: radius.md,
    paddingVertical: space(3.5),
    paddingHorizontal: space(4),
    alignSelf: 'stretch',
  },
  buttonText: { color: colors.bg, fontWeight: '900', fontSize: 15, textAlign: 'center' },
});
