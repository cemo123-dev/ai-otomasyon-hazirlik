import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AnalysisReport } from '@/components/analysis/AnalysisCards';
import { GeneratingLoader } from '@/components/analysis/GeneratingLoader';
import { PaywallGate } from '@/components/analysis/PaywallGate';
import { StatsBars } from '@/components/match/StatsBars';
import { Timeline } from '@/components/match/Timeline';
import { SegmentedTabs } from '@/components/SegmentedTabs';
import { Card, LiveMinute } from '@/components/ui';
import { useAnalysis } from '@/hooks/useAnalysis';
import { useMatch } from '@/hooks/useMatch';
import { isFinished, isLive, type Match } from '@/lib/types';
import { colors, radius, space } from '@/theme';

type TabKey = 'summary' | 'stats' | 'ai';
const TABS = [
  { key: 'summary' as const, label: 'Özet' },
  { key: 'stats' as const, label: 'İstatistik' },
  { key: 'ai' as const, label: 'AI Taktik', pro: true },
];

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const fixtureId = Number(id);
  const { match, loading } = useMatch(fixtureId);
  const [tab, setTab] = useState<TabKey>('summary');
  const { state, retry } = useAnalysis(match, tab === 'ai');

  if (loading) return <ActivityIndicator color={colors.live} style={{ flex: 1, backgroundColor: colors.bg }} />;
  if (!match) return <Text style={styles.empty}>Maç bulunamadı.</Text>;

  return (
    <>
      <Stack.Screen options={{ title: match.league_name }} />
      <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={styles.content}>
        <ScoreHeader m={match} />
        <SegmentedTabs items={TABS} value={tab} onChange={setTab} />

        {tab === 'summary' ? <Timeline match={match} /> : null}
        {tab === 'stats' ? <StatsBars match={match} /> : null}
        {tab === 'ai' ? (
          state.kind === 'idle' || state.kind === 'loading' ? (
            <ActivityIndicator color={colors.pro} style={{ marginTop: space(8) }} />
          ) : state.kind === 'not_finished' ? (
            <Card>
              <Text style={styles.cardTitle}>Analiz maç bitince hazırlanır</Text>
              <Text style={styles.muted}>
                AI taktik raporu, son düdükten sonra maçın tüm verisiyle bir kez üretilir ve tüm Pro üyelerle paylaşılır.
              </Text>
            </Card>
          ) : state.kind === 'paywall' ? (
            <PaywallGate match={match} />
          ) : state.kind === 'generating' ? (
            <GeneratingLoader />
          ) : state.kind === 'completed' ? (
            <AnalysisReport p={state.payload} match={match} />
          ) : (
            <Card>
              <Text style={styles.cardTitle}>{state.message}</Text>
              <Pressable onPress={retry} style={styles.retry}>
                <Text style={styles.retryText}>Tekrar dene</Text>
              </Pressable>
            </Card>
          )
        ) : null}
      </ScrollView>
    </>
  );
}

function ScoreHeader({ m }: { m: Match }) {
  const live = isLive(m.status_short);
  const done = isFinished(m.status_short);
  return (
    <View style={styles.scoreCard}>
      <Text style={styles.team} numberOfLines={2}>{m.home_team}</Text>
      <View style={styles.scoreMid}>
        <Text style={[styles.score, live && { color: colors.live }]}>
          {m.home_score ?? '–'} <Text style={styles.dash}>:</Text> {m.away_score ?? '–'}
        </Text>
        {live ? (
          <LiveMinute minute={m.elapsed_minute} status={m.status_short} />
        ) : (
          <Text style={styles.muted}>
            {done
              ? 'Maç Sonu'
              : new Date(m.kickoff_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        )}
      </View>
      <Text style={[styles.team, { textAlign: 'right' }]} numberOfLines={2}>{m.away_team}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: space(4), gap: space(4), paddingBottom: space(16), width: '100%', maxWidth: 720, alignSelf: 'center' },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: space(10) },
  scoreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space(5),
    gap: space(2),
  },
  team: { flex: 1, color: colors.text, fontSize: 16, fontWeight: '800' },
  scoreMid: { alignItems: 'center', gap: space(1) },
  score: { color: colors.text, fontSize: 34, fontWeight: '900', fontVariant: ['tabular-nums'] },
  dash: { color: colors.textDim },
  muted: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  cardTitle: { color: colors.text, fontWeight: '800', fontSize: 16 },
  retry: { alignSelf: 'flex-start', backgroundColor: colors.surfaceAlt, borderRadius: radius.sm, paddingHorizontal: space(4), paddingVertical: space(2) },
  retryText: { color: colors.text, fontWeight: '700' },
});
