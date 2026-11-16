import { router } from 'expo-router';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { isFinished, isLive, type Match } from '@/lib/types';
import { colors, space } from '@/theme';
import { QuarterTable } from './nba/QuarterTable';
import { Badge, LiveMinute } from './ui';

const kickoffTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

function MatchRowBase({ match: m }: { match: Match }) {
  const live = isLive(m.status_short);
  const done = isFinished(m.status_short);
  const homeWin = done && (m.home_score ?? 0) > (m.away_score ?? 0);
  const awayWin = done && (m.away_score ?? 0) > (m.home_score ?? 0);
  const nba = m.sport_type === 'nba';

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/match/[id]', params: { id: String(m.fixture_id) } })}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surfaceAlt }]}
    >
        <View style={[styles.status, nba && styles.statusNba]}>
          {live ? (
            <LiveMinute minute={m.elapsed_minute} status={m.status_short} label={nba ? m.status_detail : undefined} />
          ) : done ? (
            <Text style={styles.statusText}>MS</Text>
          ) : (
            <Text style={styles.statusText}>{kickoffTime(m.kickoff_at)}</Text>
          )}
        </View>

        <View style={styles.teams}>
          <Text style={[styles.team, awayWin && styles.loser]} numberOfLines={1}>{m.home_team}</Text>
          <Text style={[styles.team, homeWin && styles.loser]} numberOfLines={1}>{m.away_team}</Text>
          {nba && (live || done) ? <QuarterTable match={m} compact /> : null}
          {done && m.analysis_status === 'completed' ? (
            <View style={{ marginTop: 4 }}>
              <Badge label="✦ AI Analiz Hazır" color={colors.pro} />
            </View>
          ) : done && m.analysis_status === 'generating' ? (
            <View style={{ marginTop: 4 }}>
              <Badge label="AI analiz hazırlanıyor…" color={colors.textMuted} />
            </View>
          ) : null}
        </View>

        <View style={styles.scores}>
          <Text style={[styles.score, live && { color: colors.live }, awayWin && styles.loser]}>{m.home_score ?? '–'}</Text>
          <Text style={[styles.score, live && { color: colors.live }, homeWin && styles.loser]}>{m.away_score ?? '–'}</Text>
        </View>
    </Pressable>
  );
}

export const MatchRow = memo(MatchRowBase);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space(3),
    paddingHorizontal: space(4),
    gap: space(3),
    backgroundColor: colors.surface,
  },
  status: { width: 48, alignItems: 'flex-start' },
  statusNba: { width: 76 },
  statusText: { color: colors.textMuted, fontSize: 13, fontWeight: '600', fontVariant: ['tabular-nums'] },
  teams: { flex: 1, gap: 4 },
  team: { color: colors.text, fontSize: 15, fontWeight: '600' },
  loser: { color: colors.textMuted, fontWeight: '500' },
  scores: { alignItems: 'flex-end', gap: 4, minWidth: 22 },
  score: { color: colors.text, fontSize: 15, fontWeight: '800', fontVariant: ['tabular-nums'] },
});
