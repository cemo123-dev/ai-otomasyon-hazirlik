import { BlurTargetView, BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { useRef, type ComponentRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Match, NbaTacticalPayload, TacticalPayload } from '@/lib/types';
import { colors, radius, space } from '@/theme';
import { NbaAnalysisReport } from '../nba/NbaAnalysisCards';
import { Badge, Card } from '../ui';
import { AnalysisReport } from './AnalysisCards';

const zeroEff = { ts_pct: 0, fg_pct: 0, tp_pct: 0, fga: 0, tpa: 0, points: 0 };
const zeroPm = { starters_pm_avg: 0, bench_pm_avg: 0, bench_points: 0, commentary: 'İlk 5 ve yedeklerin etkisi.' };

/** NBA kart yapısını gösteren yer tutucu (gerçek analiz değil) */
const NBA_PLACEHOLDER: NbaTacticalPayload = {
  sport: 'nba',
  headline_title: 'Ana maç hükmü burada yer alır',
  executive_tactical_verdict: 'Maçın kaderini belirleyen verimlilik farkı ve kırılma periyodu bu kartta özetlenir.',
  efficiency_audit: { verdict_type: 'balanced', verdict_label: 'Verimlilik denetimi', home: zeroEff, away: zeroEff, volume_trap_team: null, commentary: 'TS% ve şut profili yorumu.' },
  quarter_runs: [
    { quarter: 1, label: 'Çeyrek', home_pts: 0, away_pts: 0, swing: 0, score_after: '', title: 'Çeyrek kırılması', description: 'Momentumun değiştiği periyot.', momentum: 'neutral' },
    { quarter: 2, label: 'Çeyrek', home_pts: 0, away_pts: 0, swing: 0, score_after: '', title: 'Çeyrek kırılması', description: 'Momentumun değiştiği periyot.', momentum: 'neutral' },
  ],
  late_game: { close_game: false, q4_home: null, q4_away: null, final_margin: 0, commentary: 'Son çeyrek yorumu.' },
  bench_impact: { home: zeroPm, away: zeroPm },
  possession_battle: {
    off_reb: { home: 0, away: 0 }, turnovers: { home: 0, away: 0 }, extra_possessions_home: 0,
    points_in_paint: null, points_off_turnovers: null, second_chance_points: null,
  },
  player_performance_spotlight: { player: 'Maçın yıldızı', team: 'home', position: '—', rating: 0, headline: 'Oyuncu performans özeti.', key_stats: [] },
};

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
          {match.sport_type === 'nba' ? (
            <NbaAnalysisReport p={NBA_PLACEHOLDER} match={match} />
          ) : (
            <AnalysisReport p={PLACEHOLDER} match={match} />
          )}
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
              {match.sport_type === 'nba'
                ? 'Şut verimliliği (TS%), kırılma periyodu, bench etkisi ve maçın yıldızı.'
                : 'xG denetimi, momentum kırılmaları, teknik direktör etki deltası ve maçın yıldızı.'}
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
