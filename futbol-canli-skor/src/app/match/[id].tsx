import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AnalysisReport } from '@/components/analysis/AnalysisCards';
import { AssistantChat } from '@/components/analysis/AssistantChat';
import { GeneratingLoader, HALFTIME_STEPS, PREVIEW_STEPS } from '@/components/analysis/GeneratingLoader';
import { AlertsFeed } from '@/components/alerts/AlertsFeed';
import { HalftimeLocked, HalftimeReport } from '@/components/halftime/HalftimeCards';
import { PaywallGate } from '@/components/analysis/PaywallGate';
import { LineupTab } from '@/components/match/LineupTab';
import { StatsBars } from '@/components/match/StatsBars';
import { Timeline } from '@/components/match/Timeline';
import { NbaAnalysisReport } from '@/components/nba/NbaAnalysisCards';
import { NbaStatsBars } from '@/components/nba/NbaStatsBars';
import { QuarterTable } from '@/components/nba/QuarterTable';
import { PreviewLocked, PreviewReport, PreviewTooEarly } from '@/components/preview/PreviewCards';
import { SegmentedTabs } from '@/components/SegmentedTabs';
import { TeamLogo } from '@/components/TeamLogo';
import { Badge, Card, CardTitle, LiveMinute } from '@/components/ui';
import { useAlerts } from '@/hooks/useAlerts';
import { useAnalysis } from '@/hooks/useAnalysis';
import { teamKey, useFollows } from '@/hooks/useFollows';
import { useHalftime, type HalftimeState } from '@/hooks/useHalftime';
import { useMatch } from '@/hooks/useMatch';
import { usePreview, type PreviewState } from '@/hooks/usePreview';
import { clockTime } from '@/lib/days';
import { getNbaStats, isFinished, isLive, isNbaPayload, type Match } from '@/lib/types';
import { colors, radius, space } from '@/theme';

type TabKey = 'summary' | 'stats' | 'lineup' | 'ai';
const TABS = [
  { key: 'summary' as const, label: 'Özet' },
  { key: 'stats' as const, label: 'İstatistik' },
  { key: 'ai' as const, label: 'AI Taktik', pro: true },
];
// "Kadro" yalnız futbolda (NBA sekmeleri değişmez)
const FOOTBALL_TABS = [TABS[0], TABS[1], { key: 'lineup' as const, label: 'Kadro' }, TABS[2]];

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const fixtureId = Number(id);
  const { match, loading } = useMatch(fixtureId);
  const [tab, setTab] = useState<TabKey>('summary');
  // Futbolda maç bitene kadar AI sekmesi "maç önü" analizini, bittikten sonra maç sonu analizini gösterir
  // Devre arasında (ve rapor hazırsa ikinci yarı boyunca) AI sekmesi "Soyunma Odası Reçetesi"ni gösterir
  const halftimeMode =
    match?.sport_type === 'football' &&
    isLive(match.status_short) &&
    (match.status_short === 'HT' || match.halftime_status === 'completed' || match.halftime_status === 'generating');
  const previewMode = match?.sport_type === 'football' && !isFinished(match.status_short) && !halftimeMode;
  const { state, retry } = useAnalysis(match, tab === 'ai' && !previewMode && !halftimeMode);
  const preview = usePreview(match, tab === 'ai' && previewMode);
  const halftime = useHalftime(match, tab === 'ai' && halftimeMode);
  const alerts = useAlerts(fixtureId);

  if (loading) return <ActivityIndicator color={colors.live} style={{ flex: 1, backgroundColor: colors.bg }} />;
  if (!match) return <Text style={styles.empty}>Maç bulunamadı.</Text>;
  const nba = match.sport_type === 'nba';

  return (
    <>
      <Stack.Screen options={{ title: match.league_name }} />
      <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={styles.content}>
        <ScoreHeader m={match} />
        {!nba && !isFinished(match.status_short) ? <FollowBar fixtureId={match.fixture_id} /> : null}
        <SegmentedTabs items={nba ? TABS : FOOTBALL_TABS} value={tab} onChange={setTab} />

        {tab === 'summary' ? <AlertsFeed match={match} alerts={alerts} /> : null}
        {tab === 'lineup' && !nba ? <LineupTab match={match} /> : null}
        {tab === 'summary' ? nba ? <NbaSummary match={match} /> : <Timeline match={match} /> : null}
        {tab === 'stats' ? nba ? <NbaStatsBars match={match} /> : <StatsBars match={match} /> : null}
        {tab === 'ai' && halftimeMode ? (
          <HalftimeSection state={halftime.state} retry={halftime.retry} match={match} />
        ) : tab === 'ai' && previewMode ? (
          <PreviewSection state={preview.state} retry={preview.retry} match={match} />
        ) : tab === 'ai' ? (
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
            <View style={{ gap: space(3) }}>
              {isNbaPayload(state.payload) ? (
                <NbaAnalysisReport p={state.payload} match={match} />
              ) : (
                <AnalysisReport p={state.payload} match={match} />
              )}
              <AssistantChat match={match} />
            </View>
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

/** Maç öncesi "Taktiksel Eşleşme & Kırılma Senaryosu" durumları */
function PreviewSection({ state, retry, match }: { state: PreviewState; retry: () => void; match: Match }) {
  switch (state.kind) {
    case 'idle':
    case 'loading':
      return <ActivityIndicator color={colors.pro} style={{ marginTop: space(8) }} />;
    case 'too_early':
      return <PreviewTooEarly match={match} />;
    case 'paywall':
      return <PreviewLocked match={match} />;
    case 'generating':
      return <GeneratingLoader steps={PREVIEW_STEPS} title="Maç önü taktik analizi hazırlanıyor" />;
    case 'completed':
      return <PreviewReport p={state.payload} match={match} />;
    case 'not_prematch':
    case 'not_supported':
      return (
        <Card>
          <Text style={styles.cardTitle}>Analiz maç bitince hazırlanır</Text>
          <Text style={styles.muted}>
            Bu maç için maç önü analizi üretilmedi. AI taktik raporu son düdükten sonra maçın tüm verisiyle bir kez üretilir.
          </Text>
        </Card>
      );
    default:
      return (
        <Card>
          <Text style={styles.cardTitle}>{state.message}</Text>
          <Pressable onPress={retry} style={styles.retry}>
            <Text style={styles.retryText}>Tekrar dene</Text>
          </Pressable>
        </Card>
      );
  }
}

/** Canlı devre arası "Soyunma Odası Reçetesi" durumları */
function HalftimeSection({ state, retry, match }: { state: HalftimeState; retry: () => void; match: Match }) {
  switch (state.kind) {
    case 'idle':
    case 'loading':
      return <ActivityIndicator color={colors.pro} style={{ marginTop: space(8) }} />;
    case 'paywall':
      return <HalftimeLocked match={match} />;
    case 'generating':
      return <GeneratingLoader steps={HALFTIME_STEPS} title="Devre arası raporu hazırlanıyor" />;
    case 'completed':
      return <HalftimeReport p={state.payload} match={match} />;
    case 'not_halftime':
      return (
        <Card>
          <Text style={styles.cardTitle}>Rapor devre arasında hazırlanır</Text>
          <Text style={styles.muted}>Hakem ilk yarıyı bitirince ilk yarı verisiyle ikinci yarı reçetesi üretilir.</Text>
        </Card>
      );
    default:
      return (
        <Card>
          <Text style={styles.cardTitle}>{state.message}</Text>
          <Pressable onPress={retry} style={styles.retry}>
            <Text style={styles.retryText}>Tekrar dene</Text>
          </Pressable>
        </Card>
      );
  }
}

/** Takip: devre arası raporu ve akıllı alarmlar yalnız takip edilen maçlar için gönderilir */
function FollowBar({ fixtureId }: { fixtureId: number }) {
  const { followed, toggle, pushNotice } = useFollows();
  const on = followed.has(fixtureId);
  return (
    <View style={{ gap: space(1.5) }}>
      <Pressable
        accessibilityRole="button"
        onPress={() => toggle(fixtureId).catch(() => {})}
        style={({ pressed }) => [styles.follow, on && styles.followOn, pressed && { opacity: 0.85 }]}
      >
        <Text style={[styles.followText, on && { color: colors.pro }]}>
          {on ? '🔔 Takip ediliyor · akıllı alarmlar açık' : '🔕 Maçı takip et · akıllı alarm ve devre arası raporu al'}
        </Text>
      </Pressable>
      {on && pushNotice ? <Text style={styles.notice}>{pushNotice}</Text> : null}
    </View>
  );
}

function ScoreHeader({ m }: { m: Match }) {
  const live = isLive(m.status_short);
  const done = isFinished(m.status_short);
  return (
    <View style={styles.scoreCard}>
      <TeamSide m={m} side="home" />
      <View style={styles.scoreMid}>
        <Text style={[styles.score, live && { color: colors.live }]}>
          {m.home_score ?? '–'} <Text style={styles.dash}>:</Text> {m.away_score ?? '–'}
        </Text>
        {live ? (
          <LiveMinute minute={m.elapsed_minute} status={m.status_short} label={m.sport_type === 'nba' ? m.status_detail : undefined} />
        ) : (
          <Text style={styles.muted}>
            {done
              ? 'Maç Sonu'
              : new Date(m.kickoff_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        )}
        {/* Veri tazeliği: ücretsiz planda canlı skor ~30 dk'da bir güncellenir; gecikme gizlenmez */}
        {(live || done) && m.updated_at ? (
          <Text style={styles.fresh}>Son güncelleme {clockTime(m.updated_at)}</Text>
        ) : null}
      </View>
      <TeamSide m={m} side="away" />
    </View>
  );
}

/** Logo + ad + takım takip yıldızı (takımın maçları otomatik takibe alınır) */
function TeamSide({ m, side }: { m: Match; side: 'home' | 'away' }) {
  const { teams, toggleTeam } = useFollows();
  const name = side === 'home' ? m.home_team : m.away_team;
  const logo = side === 'home' ? m.home_logo : m.away_logo;
  const id = side === 'home' ? m.home_team_id : m.away_team_id;
  const on = id != null && teams.has(teamKey(m.sport_type, id));
  return (
    <View style={styles.side}>
      <TeamLogo uri={logo} name={name} size={44} />
      <Text style={styles.team} numberOfLines={2}>{name}</Text>
      {id != null ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={on ? `${name} takibini bırak` : `${name} takımını takip et`}
          hitSlop={8}
          onPress={() => toggleTeam({ sport_type: m.sport_type, team_id: id, team_name: name, team_logo: logo ?? null }).catch(() => {})}
          style={[styles.star, on && styles.starOn]}
        >
          <Text style={[styles.starText, on && { color: colors.pro }]}>{on ? '★ Takipte' : '☆ Takip et'}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** NBA Özet sekmesi: çeyrek tablosu + ücretsiz teaser + kırılma anı */
function NbaSummary({ match }: { match: Match }) {
  const mt = getNbaStats(match)?.metrics;
  return (
    <View style={{ gap: space(3) }}>
      <Card>
        <CardTitle kicker="Çeyrek Skorları" title={isLive(match.status_short) ? (match.status_detail ?? 'Canlı') : 'Periyot periyot'} />
        {match.period_scores ? (
          <QuarterTable match={match} />
        ) : (
          <Text style={styles.muted}>Çeyrek skorları maç başlayınca görünecek.</Text>
        )}
      </Card>
      {match.summary_teaser ? (
        <Card>
          <CardTitle kicker="Maç Özeti" title="Kısa bakış" />
          <Text style={styles.teaser}>{match.summary_teaser}</Text>
        </Card>
      ) : null}
      {mt?.decisive ? (
        <Card>
          <Badge label="KIRILMA ANI" color={colors.warning} />
          <Text style={styles.teaser}>{mt.decisive.text}</Text>
        </Card>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  teaser: { color: colors.text, fontSize: 14, lineHeight: 21 },
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
  side: { flex: 1, alignItems: 'center', gap: space(1.5) },
  team: { color: colors.text, fontSize: 15, fontWeight: '800', textAlign: 'center' },
  star: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: space(2.5), paddingVertical: space(1) },
  starOn: { borderColor: colors.pro, backgroundColor: colors.proGlow },
  starText: { color: colors.textMuted, fontSize: 11, fontWeight: '800' },
  scoreMid: { alignItems: 'center', gap: space(1) },
  score: { color: colors.text, fontSize: 34, fontWeight: '900', fontVariant: ['tabular-nums'] },
  dash: { color: colors.textDim },
  fresh: { color: colors.textDim, fontSize: 11, textAlign: 'center', fontVariant: ['tabular-nums'] },
  muted: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  cardTitle: { color: colors.text, fontWeight: '800', fontSize: 16 },
  retry: { alignSelf: 'flex-start', backgroundColor: colors.surfaceAlt, borderRadius: radius.sm, paddingHorizontal: space(4), paddingVertical: space(2) },
  retryText: { color: colors.text, fontWeight: '700' },
  follow: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: space(2.5), paddingHorizontal: space(3), backgroundColor: colors.surface },
  followOn: { borderColor: colors.pro, backgroundColor: colors.proGlow },
  followText: { color: colors.textMuted, fontWeight: '700', fontSize: 13, textAlign: 'center' },
  notice: { color: colors.textDim, fontSize: 11, lineHeight: 15, textAlign: 'center' },
});
