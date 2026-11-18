import { router } from 'expo-router';
import { memo } from 'react';
import { AccessibilityInfo, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFollows } from '@/hooks/useFollows';
import { clockTime } from '@/lib/days';
import { isFinished, isLive, isOff, offLabel, statusSpeech, type Match } from '@/lib/types';
import { colors, hit, space } from '@/theme';
import { QuarterTable } from './nba/QuarterTable';
import { TeamLogo } from './TeamLogo';
import { Badge, LiveMinute, maxFontScale } from './ui';

const kickoffTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

/** Zil: maçı takip et → devre arası AI bildirimi (yalnız futbol, bitmemiş maç) */
function FollowBell({ on, teams, onToggle }: { on: boolean; teams: string; onToggle: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      // Hangi maç olduğu söylenir (Android/web'de tüm ziller aynı etiketi taşıyordu)
      accessibilityLabel={on ? `${teams} maçının takibini bırak` : `${teams} maçını takip et`}
      onPress={onToggle}
      style={styles.bell}
    >
      {/* Kapalı: soluk zil (çizgili simge yok); anlam accessibilityLabel ile verilir */}
      <Text style={[styles.bellIcon, !on && styles.bellOff]}>🔔</Text>
    </Pressable>
  );
}

/** Ekran okuyucu özeti: "Galatasaray 1, Fenerbahçe 0, 58. dakika" */
function rowLabel(m: Match, live: boolean, done: boolean): string {
  const status = statusSpeech(m.status_short, m.elapsed_minute, m.sport_type === 'nba' ? 'nba' : 'football');
  const scored = (live || done) && m.home_score != null && m.away_score != null;
  const teams = scored ? `${m.home_team} ${m.home_score}, ${m.away_team} ${m.away_score}` : `${m.home_team} - ${m.away_team}`;
  const when = status || (m.status_short === 'TBD' ? 'saat belli değil' : `başlama ${kickoffTime(m.kickoff_at)}`);
  return `${teams}, ${when}`;
}

function MatchRowBase({ match: m }: { match: Match }) {
  const live = isLive(m.status_short);
  const done = isFinished(m.status_short);
  const off = isOff(m.status_short);
  const homeWin = done && (m.home_score ?? 0) > (m.away_score ?? 0);
  const awayWin = done && (m.away_score ?? 0) > (m.home_score ?? 0);
  const nba = m.sport_type === 'nba';
  const bell = !nba && !done && !off;
  const teams = `${m.home_team} - ${m.away_team}`;
  // iOS VoiceOver satırı tek öğe yapar; içteki zile odaklanılamaz. Takip, satırın erişilebilirlik
  // eylemi olarak da sunulur (Döngü 4, bulgu 5).
  const { followed, toggle } = useFollows();
  const on = followed.has(m.fixture_id);
  // Eylem sonrası sesli geri bildirim (Döngü 5, bulgu 7); hata FollowErrorNotice ile gösterilir
  const toggleFollow = () => {
    const wasOn = on;
    toggle(m.fixture_id)
      .then(() => AccessibilityInfo.announceForAccessibility(wasOn ? 'Takip bırakıldı' : 'Maç takip ediliyor'))
      .catch(() => {});
  };

  return (
    <Pressable
      // Web'de rol verilmez: içteki zil butonu iç içe <button> olurdu (geçersiz HTML)
      accessibilityRole={Platform.OS === 'web' ? undefined : 'button'}
      // Takip durumu satır etiketinde de söylenir (Döngü 5, bulgu 7)
      accessibilityLabel={`${rowLabel(m, live, done)}${bell && on ? ', takip ediliyor' : ''}`}
      accessibilityHint="Maç ayrıntılarını açar"
      accessibilityActions={bell ? [{ name: 'toggleFollow', label: on ? 'Takibi bırak' : 'Takip et' }] : undefined}
      onAccessibilityAction={
        bell
          ? (e) => {
              if (e.nativeEvent.actionName === 'toggleFollow') toggleFollow();
            }
          : undefined
      }
      onPress={() => router.push({ pathname: '/match/[id]', params: { id: String(m.fixture_id) } })}
      style={({ pressed }) => [styles.row, live && styles.rowLive, pressed && { backgroundColor: colors.surfaceAlt }]}
    >
        <View style={[styles.status, nba && styles.statusNba]}>
          {live ? (
            <LiveMinute minute={m.elapsed_minute} status={m.status_short} label={nba ? m.status_detail : undefined} />
          ) : done ? (
            <Text style={styles.statusText}>MS</Text>
          ) : off ? (
            <Text style={[styles.statusText, styles.statusOff]} numberOfLines={1} adjustsFontSizeToFit>
              {offLabel(m.status_short, 'short')}
            </Text>
          ) : m.status_short === 'TBD' ? (
            <Text style={styles.statusTbd} numberOfLines={1}>Belirsiz</Text>
          ) : (
            <Text style={[styles.statusText, styles.statusKickoff]}>{kickoffTime(m.kickoff_at)}</Text>
          )}
        </View>

        <View style={styles.teams}>
          <View style={styles.teamLine}>
            <TeamLogo uri={m.home_logo} name={m.home_team} size={18} />
            {/* Skor sütunu satırlarla hizalı kalsın diye tek satır; büyük yazıda en fazla ×1,2 (×1,24'te sığıyor) */}
            <Text style={[styles.team, awayWin && styles.loser]} numberOfLines={1} {...maxFontScale(1.2)}>
              {m.home_team}
            </Text>
          </View>
          <View style={styles.teamLine}>
            <TeamLogo uri={m.away_logo} name={m.away_team} size={18} />
            <Text style={[styles.team, homeWin && styles.loser]} numberOfLines={1} {...maxFontScale(1.2)}>
              {m.away_team}
            </Text>
          </View>
          {nba && (live || done) ? <QuarterTable match={m} compact /> : null}
          {/* Veri tazeliği: ücretsiz planda canlı skor ~30 dk'da bir güncellenir; gecikme gizlenmez */}
          {live && m.updated_at ? <Text style={styles.fresh}>Son güncelleme {clockTime(m.updated_at)}</Text> : null}
          {done && m.analysis_status === 'completed' ? (
            <View style={{ marginTop: 4 }}>
              <Badge label="✦ AI Analiz Hazır" color={colors.pro} />
            </View>
          ) : done && m.analysis_status === 'generating' ? (
            <View style={{ marginTop: 4 }}>
              <Badge label="AI analiz hazırlanıyor…" color={colors.textMuted} />
            </View>
          ) : live && m.halftime_status === 'completed' ? (
            <View style={{ marginTop: 4 }}>
              <Badge label="✦ Devre Arası AI Hazır" color={colors.pro} />
            </View>
          ) : !done && m.preview_status === 'completed' ? (
            <View style={{ marginTop: 4 }}>
              <Badge label="✦ Maç Önü AI Hazır" color={colors.pro} />
            </View>
          ) : null}
        </View>

        <View style={styles.scores}>
          <Text style={[styles.score, live && styles.scoreLive, awayWin && styles.loser, m.home_score == null && styles.scoreNone]}>
            {m.home_score ?? '–'}
          </Text>
          <Text style={[styles.score, live && styles.scoreLive, homeWin && styles.loser, m.away_score == null && styles.scoreNone]}>
            {m.away_score ?? '–'}
          </Text>
        </View>
        {bell ? <FollowBell on={on} teams={teams} onToggle={toggleFollow} /> : null}
    </Pressable>
  );
}

export const MatchRow = memo(MatchRowBase);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 64,
    paddingVertical: space(3),
    paddingHorizontal: space(4),
    gap: space(3),
    backgroundColor: colors.surface,
  },
  // Canlı satır: sol 3 px yeşil şerit (içerik hizası korunur)
  rowLive: { borderLeftWidth: 3, borderLeftColor: colors.live, paddingLeft: space(4) - 3 },
  status: { width: 48, alignItems: 'flex-start' },
  statusNba: { width: 76 },
  statusText: { color: colors.textMuted, fontSize: 13, fontWeight: '600', fontVariant: ['tabular-nums'] },
  statusKickoff: { color: colors.text },
  statusTbd: { color: colors.textMuted, fontSize: 12, fontWeight: '500' },
  statusOff: { color: colors.warning, fontSize: 12, fontWeight: '700' },
  teams: { flex: 1, gap: 4 },
  teamLine: { flexDirection: 'row', alignItems: 'center', gap: space(2) },
  team: { flexShrink: 1, color: colors.text, fontSize: 15, fontWeight: '600' },
  loser: { color: colors.textMuted, fontWeight: '500' },
  scores: { alignItems: 'flex-end', gap: 4, minWidth: 28 },
  fresh: { color: colors.textDim, fontSize: 11, fontVariant: ['tabular-nums'] },
  // 44×44 dokunma alanı; satır sağ boşluğu zilin iç boşluğuyla dengelenir
  bell: { width: hit, height: hit, alignItems: 'center', justifyContent: 'center', marginVertical: -space(2), marginRight: -space(2) },
  bellIcon: { fontSize: 18 },
  bellOff: { opacity: 0.4 },
  score: { color: colors.text, fontSize: 15, fontWeight: '800', fontVariant: ['tabular-nums'] },
  scoreLive: { color: colors.live, fontSize: 16, fontWeight: '900' },
  scoreNone: { color: colors.textDim },
});
