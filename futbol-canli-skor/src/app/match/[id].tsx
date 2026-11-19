import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AnalysisReport } from '@/components/analysis/AnalysisCards';
import { AssistantChat } from '@/components/analysis/AssistantChat';
import { GeneratingLoader, HALFTIME_STEPS, NBA_STEPS, PREVIEW_STEPS } from '@/components/analysis/GeneratingLoader';
import { AlertsFeed } from '@/components/alerts/AlertsFeed';
import { FollowErrorNotice } from '@/components/FollowErrorNotice';
import { HalftimeLocked, HalftimeReport } from '@/components/halftime/HalftimeCards';
import { PaywallGate } from '@/components/analysis/PaywallGate';
import { LineupTab } from '@/components/match/LineupTab';
import { StatsBars } from '@/components/match/StatsBars';
import { Timeline } from '@/components/match/Timeline';
import { NbaAnalysisReport } from '@/components/nba/NbaAnalysisCards';
import { BoxScoreTab } from '@/components/nba/BoxScoreTab';
import { NbaStatsBars } from '@/components/nba/NbaStatsBars';
import { QuarterTable } from '@/components/nba/QuarterTable';
import { PreviewLocked, PreviewReport, PreviewTooEarly } from '@/components/preview/PreviewCards';
import { SegmentedTabs } from '@/components/SegmentedTabs';
import { ShareButton } from '@/components/ShareButton';
import { TeamLogo } from '@/components/TeamLogo';
import { Badge, Card, CardTitle, LiveMinute, maxFontScale } from '@/components/ui';
import { useAlerts } from '@/hooks/useAlerts';
import { useAnalysis } from '@/hooks/useAnalysis';
import { useApiPaid } from '@/hooks/useApiPaid';
import { teamKey, useFollows } from '@/hooks/useFollows';
import { useHalftime, type HalftimeState } from '@/hooks/useHalftime';
import { useMatch } from '@/hooks/useMatch';
import { usePreview, type PreviewState } from '@/hooks/usePreview';
import { enterLiveScreen } from '@/lib/appSignals';
import { clockTime } from '@/lib/days';
import { noteAiReportViewed } from '@/lib/reviewPrompt';
import { getNbaStats, isFinished, isLive, isNbaPayload, isOff, offLabel, type Match } from '@/lib/types';
import { colors, hit, radius, space, type } from '@/theme';

type TabKey = 'summary' | 'stats' | 'lineup' | 'box' | 'ai';
const TABS = [
  { key: 'summary' as const, label: 'Özet' },
  { key: 'stats' as const, label: 'İstatistik' },
  { key: 'ai' as const, label: 'AI Taktik', pro: true },
];
// "Kadro" yalnız futbolda (NBA sekmeleri değişmez)
const FOOTBALL_TABS = [TABS[0], TABS[1], { key: 'lineup' as const, label: 'Kadro' }, TABS[2]];
// NBA: oyuncu bazında box score
const NBA_TABS = [TABS[0], TABS[1], { key: 'box' as const, label: 'Box Score' }, TABS[2]];

/** Bildirimden / derin bağlantıdan açıldıysa geri yığını boştur: "‹ Maçlar" ana ekrana döner */
function BackToList() {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Maçlar listesine dön"
      onPress={() => router.replace('/')}
      style={[styles.backBtn, Platform.OS === 'web' && { paddingLeft: space(4) }]}
    >
      <Text style={styles.backText}>‹ Maçlar</Text>
    </Pressable>
  );
}

// Geri yığını varsa varsayılan geri oku kalır (headerLeft verilmez)
const backOptions = () => (router.canGoBack() ? {} : { headerLeft: () => <BackToList /> });

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const fixtureId = Number(id);
  const { match, loading, error, reload } = useMatch(fixtureId);
  const [tab, setTab] = useState<TabKey>('summary');
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  };
  // Ertelenen / iptal / yarıda kalan / hükmen maç: AI üretilmez, takip edilmez
  const off = match ? isOff(match.status_short) : false;
  // Futbolda maç bitene kadar AI sekmesi "maç önü" analizini, bittikten sonra maç sonu analizini gösterir
  // Devre arasında (ve rapor hazırsa ikinci yarı boyunca) AI sekmesi "Soyunma Odası Reçetesi"ni gösterir
  const halftimeMode =
    match?.sport_type === 'football' &&
    isLive(match.status_short) &&
    (match.status_short === 'HT' || match.halftime_status === 'completed' || match.halftime_status === 'generating');
  const previewMode = match?.sport_type === 'football' && !isFinished(match.status_short) && !halftimeMode && !off;
  const { state, retry } = useAnalysis(match, tab === 'ai' && !previewMode && !halftimeMode && !off);
  const preview = usePreview(match, tab === 'ai' && previewMode);
  const halftime = useHalftime(match, tab === 'ai' && halftimeMode);
  const alerts = useAlerts(fixtureId);

  // P3 değerlendirme sinyalleri (reviewPolicy.ts): tamamlanmış AI raporu görüldü; canlı maç ekranı açık
  const aiShown = tab === 'ai' && (state.kind === 'completed' || preview.state.kind === 'completed');
  useEffect(() => {
    if (aiShown) void noteAiReportViewed();
  }, [aiShown]);
  const liveNow = !!match && isLive(match.status_short);
  useEffect(() => (liveNow ? enterLiveScreen() : undefined), [liveNow]);

  if (loading) return <ActivityIndicator color={colors.live} style={{ flex: 1, backgroundColor: colors.bg }} />;
  if (!match) {
    // Ağ hatası "Maç bulunamadı" değildir: anlaşılır metin + yeniden deneme
    return (
      <View style={styles.missing}>
        <Stack.Screen options={backOptions()} />
        <Text style={styles.missingText} accessibilityRole={error ? 'alert' : undefined}>
          {error ?? 'Maç bulunamadı.'}
        </Text>
        {error ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Maçı yeniden yükle"
            disabled={refreshing}
            onPress={onRefresh}
            style={({ pressed }) => [styles.retry, styles.retryCenter, (pressed || refreshing) && { opacity: 0.7 }]}
          >
            {refreshing ? <ActivityIndicator color={colors.text} size="small" /> : <Text style={styles.retryText}>Tekrar dene</Text>}
          </Pressable>
        ) : null}
      </View>
    );
  }
  const nba = match.sport_type === 'nba';

  return (
    <>
      <Stack.Screen
        options={{
          title: match.league_name,
          // 360 pt'de "‹ Maçlar" + başlık + "Paylaş" çakışmasın: uzun lig adı "…" ile kesilir (tasarım tur 2 §D-1)
          headerTitle: () => (
            <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail" maxFontSizeMultiplier={1.3}>
              {match.league_name}
            </Text>
          ),
          ...backOptions(),
          // F3: görünürlük ShareButton içinde (canlı / ertelenen / iptal / indirme adresi yok → çizilmez)
          headerRight: () => <ShareButton match={match} />,
        }}
      />
      {/* Klavye asistan girişini örtmesin: iOS'ta ScrollView iç boşluğu, Android'de (edge-to-edge) KeyboardAvoidingView */}
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior="height" enabled={Platform.OS === 'android'}>
      <ScrollView
        style={{ backgroundColor: colors.bg }}
        contentContainerStyle={styles.content}
        // Klavye açıkken "Sor"a ilk dokunuş klavyeyi kapatmakla kalmasın, soruyu da göndersin
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.live} />}
      >
        <ScoreHeader m={match} />
        <FollowErrorNotice />
        {!nba && !isFinished(match.status_short) && !off ? <FollowBar fixtureId={match.fixture_id} /> : null}
        <SegmentedTabs items={nba ? NBA_TABS : FOOTBALL_TABS} value={tab} onChange={setTab} />

        {tab === 'summary' ? <AlertsFeed match={match} alerts={alerts} /> : null}
        {tab === 'lineup' && !nba ? <LineupTab match={match} /> : null}
        {tab === 'box' && nba ? <BoxScoreTab match={match} /> : null}
        {tab === 'summary' ? nba ? <NbaSummary match={match} /> : <Timeline match={match} /> : null}
        {tab === 'stats' ? nba ? <NbaStatsBars match={match} /> : <StatsBars match={match} /> : null}
        {tab === 'ai' && off ? (
          <Card>
            <Text style={styles.cardTitle}>Maç: {offLabel(match.status_short)}</Text>
            <Text style={styles.muted}>Bu maç sahada tamamlanmadığı için AI taktik analizi üretilmez.</Text>
          </Card>
        ) : tab === 'ai' && halftimeMode ? (
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
                AI taktik raporu, maç bittikten sonra maçın tüm verisiyle bir kez üretilir ve tüm Pro üyelerle paylaşılır.
              </Text>
            </Card>
          ) : state.kind === 'not_ready' ? (
            <Card>
              <Text style={styles.cardTitle}>Maç verisi bekleniyor</Text>
              <Text style={styles.muted}>
                Analiz, maçın istatistikleri gelince hazırlanır (genelde maç bittikten sonraki senkronda). Deneme hakkından düşülmedi.
              </Text>
              <Pressable accessibilityRole="button" onPress={retry} style={styles.retry}>
                <Text style={styles.retryText}>Tekrar kontrol et</Text>
              </Pressable>
            </Card>
          ) : state.kind === 'paywall' ? (
            <PaywallGate match={match} />
          ) : state.kind === 'generating' ? (
            <GeneratingLoader steps={match.sport_type === 'nba' ? NBA_STEPS : undefined} />
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
              <Pressable accessibilityRole="button" onPress={retry} style={styles.retry}>
                <Text style={styles.retryText}>Tekrar dene</Text>
              </Pressable>
            </Card>
          )
        ) : null}
      </ScrollView>
      </KeyboardAvoidingView>
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
    case 'not_ready':
      return (
        <Card>
          {/* Neden ilk 11 de olabilir kota koruması da; sunucu bu durumda ~10 dk not_ready döner (Döngü 5, bulgu 9) */}
          <Text style={styles.cardTitle}>Maç önü analizi şu an hazırlanamıyor</Text>
          <Text style={styles.muted}>
            Analiz ilk 11 açıklanınca hazırlanır (genelde başlama saatinden 20-40 dk önce). ~10 dk sonra tekrar dene.
          </Text>
          <Pressable accessibilityRole="button" onPress={retry} style={styles.retry}>
            <Text style={styles.retryText}>Tekrar kontrol et</Text>
          </Pressable>
        </Card>
      );
    case 'not_prematch':
    case 'not_supported':
      return (
        <Card>
          <Text style={styles.cardTitle}>Analiz maç bitince hazırlanır</Text>
          <Text style={styles.muted}>
            Bu maç için maç önü analizi üretilmedi. AI taktik raporu maç bittikten sonra maçın tüm verisiyle bir kez üretilir.
          </Text>
        </Card>
      );
    default:
      return (
        <Card>
          <Text style={styles.cardTitle}>{state.message}</Text>
          <Pressable accessibilityRole="button" onPress={retry} style={styles.retry}>
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
          <Pressable accessibilityRole="button" onPress={retry} style={styles.retry}>
            <Text style={styles.retryText}>Tekrar dene</Text>
          </Pressable>
        </Card>
      );
  }
}

/** Takip: bildirimler yalnız takip edilen maçlar için gönderilir. Akıllı alarmlar yalnız ücretli API planında. */
function FollowBar({ fixtureId }: { fixtureId: number }) {
  const { followed, toggle, pushNotice } = useFollows();
  // Takip bandı yalnız futbol maçında çizilir: futbolun planı (NBA ücretsiz kalır, 0018)
  const paid = useApiPaid('football');
  const on = followed.has(fixtureId);
  // Ücretsiz planda (veya plan bilinmiyorken) çalışmayan özellik vaat edilmez
  const label = on
    ? paid
      ? '🔔 Takip ediliyor · akıllı alarmlar açık'
      : '🔔 Takip ediliyor · maç başlayınca bildirim gelir'
    : paid
      ? '🔔 Maçı takip et · akıllı alarm ve devre arası raporu al'
      : '🔔 Maçı takip et · maç başlayınca bildirim al';
  return (
    <View style={{ gap: space(1.5) }}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: on }}
        // Hata kullanıcıya FollowErrorNotice ile gösterilir (useFollows)
        onPress={() => toggle(fixtureId).catch(() => {})}
        style={({ pressed }) => [styles.follow, on && styles.followOn, pressed && { opacity: 0.85 }]}
      >
        <Text style={[styles.followText, on && { color: colors.pro }]}>{label}</Text>
      </Pressable>
      {on && pushNotice ? <Text style={styles.notice}>{pushNotice}</Text> : null}
    </View>
  );
}

function ScoreHeader({ m }: { m: Match }) {
  const live = isLive(m.status_short);
  const done = isFinished(m.status_short);
  const off = offLabel(m.status_short);
  // NBA'de üç haneli skor (≥100) dar ekranda sığsın
  const big = (m.home_score ?? 0) >= 100 || (m.away_score ?? 0) >= 100;
  // İki ad aynı puntoda yazılır (tasarım B-1): boyut iki takım için birlikte hesaplanır
  const nameSize = Math.min(teamNameSize(m.home_team), teamNameSize(m.away_team));
  return (
    <View style={styles.scoreCard}>
      {/* Tasarım tur 3 T3-1: iki katman. (1) üç sütunlu satır; (2) altta tam genişlikte "Son güncelleme" */}
      <View style={styles.scoreRow}>
        <TeamSide m={m} side="home" nameSize={nameSize} />
        <View style={styles.scoreMid}>
          <Text style={[styles.score, big && styles.scoreBig, live && { color: colors.live }]} maxFontSizeMultiplier={1.3}>
            {m.home_score ?? '–'} <Text style={styles.dash}>:</Text> {m.away_score ?? '–'}
          </Text>
          {live ? (
            <LiveMinute minute={m.elapsed_minute} status={m.status_short} label={m.sport_type === 'nba' ? m.status_detail : undefined} />
          ) : (
            <Text style={[styles.muted, !done && !off && m.status_short !== 'TBD' && styles.kickoff, off ? styles.offText : null]}>
              {done
                ? 'Maç Sonu'
                : off
                  ? off
                  : m.status_short === 'TBD'
                    ? 'Saat belli değil'
                    : new Date(m.kickoff_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          )}
        </View>
        <TeamSide m={m} side="away" nameSize={nameSize} />
      </View>
      {/* Veri tazeliği: gecikme gizlenmez. Orta sütunda büyük yazıda takip haplarının üstüne biniyordu
          (lf1-mac-buyukyazi); artık kendi tam genişlikteki satırında, tek satır. */}
      {(live || done) && m.updated_at ? (
        <Text style={styles.fresh} numberOfLines={1} {...maxFontScale(1.3)}>
          Son güncelleme {clockTime(m.updated_at)}
        </Text>
      ) : null}
    </View>
  );
}

/**
 * Uzun tek kelime ("Lakeshore") dar sütunda kelime ortasından bölünmesin: boyut önceden küçültülür
 * (adjustsFontSizeToFit web'de yok; native'de ayrıca devrede). En uzun kelime ≥12 harf → 12, ≥9 → 13, değilse 15.
 * Sistem yazı ölçeği bu sütunda uygulanmaz (TEAM_NAME_MAX_SCALE = 1): ×1,3'te "Boğazi / çi SK" bölünüyordu
 * (Döngü 5, bulgu 4). Ad zaten kalın 12–15 pt; tam ad ekran okuyucuya da gider ("X, ev sahibi").
 */
// Kapsam (tasarım tur 3 §B): YALNIZ skor başlığındaki takım adı; başka yerde maxFontSizeMultiplier={1} kullanılmaz.
const TEAM_NAME_MAX_SCALE = 1;
function teamNameSize(name: string): number {
  const longest = Math.max(...name.split(/\s+/).map((w) => w.length));
  return longest >= 12 ? 12 : longest >= 9 ? 13 : 15;
}

/** Logo + ad + takım takip yıldızı (takımın maçları otomatik takibe alınır) */
function TeamSide({ m, side, nameSize }: { m: Match; side: 'home' | 'away'; nameSize: number }) {
  const { teams, toggleTeam } = useFollows();
  const name = side === 'home' ? m.home_team : m.away_team;
  const logo = side === 'home' ? m.home_logo : m.away_logo;
  const id = side === 'home' ? m.home_team_id : m.away_team_id;
  const on = id != null && teams.has(teamKey(m.sport_type, id));
  return (
    <View style={styles.side}>
      {/* Tasarım tur 3 §B koşul 1: ölçeksiz ad ekran okuyucuda tam okunur ("Boğaziçi SK, ev sahibi") */}
      <View style={styles.sideId} accessible accessibilityLabel={`${name}, ${side === 'home' ? 'ev sahibi' : 'deplasman'}`}>
        <TeamLogo uri={logo} name={name} size={44} />
        {/* Kelime ortasından bölünmesin: önce küçülür (en fazla %80), sonra kelime sınırında iki satıra iner */}
        <Text
          style={[styles.team, { fontSize: nameSize }]}
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
          {...maxFontScale(TEAM_NAME_MAX_SCALE)}
          textBreakStrategy="simple"
        >
          {name}
        </Text>
      </View>
      {/* Takip hapı sütunun dibine itilir: iki taraftaki haplar aynı hizada (tasarım B-2) */}
      {id != null ? (
        <View style={styles.starWrap}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={on ? `${name} takibini bırak` : `${name} takımını takip et`}
            hitSlop={6}
            accessibilityState={{ selected: on }}
            onPress={() => toggleTeam({ sport_type: m.sport_type, team_id: id, team_name: name, team_logo: logo ?? null }).catch(() => {})}
            style={[styles.star, on && styles.starOn]}
          >
            <Text style={[styles.starText, on && { color: colors.pro }]} numberOfLines={1}>
              {on ? '★ Takipte' : '☆ Takip et'}
            </Text>
          </Pressable>
        </View>
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
        <CardTitle kicker="ÇEYREK SKORLARI" title={isLive(match.status_short) ? (match.status_detail ?? 'Canlı') : 'Periyot periyot'} />
        {match.period_scores ? (
          <QuarterTable match={match} />
        ) : (
          <Text style={styles.muted}>Çeyrek skorları maç başlayınca görünecek.</Text>
        )}
      </Card>
      {match.summary_teaser ? (
        <Card>
          <CardTitle kicker="MAÇ ÖZETİ" title="Kısa bakış" />
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
  missing: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', paddingTop: space(16), paddingHorizontal: space(6), gap: space(4) },
  missingText: { color: colors.textMuted, textAlign: 'center', fontSize: 15, lineHeight: 21 },
  retryCenter: { alignSelf: 'center', minWidth: 140, alignItems: 'center' },
  offText: { color: colors.warning, fontWeight: '700' },
  scoreCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space(5),
  },
  scoreRow: {
    flexDirection: 'row',
    // Sütunlar eşit yükseklikte: ad iki satıra inse de logolar üstte, takip hapları altta hizalı (B-2)
    alignItems: 'stretch',
    gap: space(2),
  },
  side: { flex: 1, alignItems: 'center', gap: space(1.5) },
  sideId: { alignItems: 'center', gap: space(1.5), alignSelf: 'stretch' },
  team: { color: colors.text, fontSize: 15, fontWeight: '800', textAlign: 'center' },
  starWrap: { marginTop: 'auto' },
  star: {
    minHeight: 32,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.pill,
    paddingHorizontal: space(2.5),
  },
  starOn: { borderColor: colors.pro, backgroundColor: colors.proGlow },
  starText: { color: colors.textMuted, fontSize: 11, fontWeight: '800' },
  scoreMid: { alignItems: 'center', alignSelf: 'center', flexShrink: 0, gap: space(1), maxWidth: '40%' },
  score: { color: colors.text, fontSize: 34, lineHeight: 40, fontWeight: '900', fontVariant: ['tabular-nums'] },
  scoreBig: { fontSize: 30, lineHeight: 36 },
  kickoff: { color: colors.text, fontSize: 17, lineHeight: 22, fontWeight: '800' },
  dash: { color: colors.textDim },
  // caption ölçüsü; sabit lineHeight yok: büyük yazıda tek satır alt kenardan kırpılmasın
  fresh: {
    fontSize: type.caption.fontSize,
    fontWeight: type.caption.fontWeight,
    color: colors.textDim,
    textAlign: 'center',
    marginTop: space(3),
    fontVariant: ['tabular-nums'],
  },
  muted: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  cardTitle: { color: colors.text, fontWeight: '800', fontSize: 16 },
  retry: {
    alignSelf: 'flex-start',
    minHeight: hit,
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingHorizontal: space(4),
  },
  retryText: { color: colors.text, fontWeight: '700', fontSize: 14 },
  backBtn: { minHeight: hit, minWidth: hit, justifyContent: 'center', paddingRight: space(2) },
  backText: { color: colors.accent, fontSize: 15, fontWeight: '700' },
  headerTitle: { color: colors.text, fontSize: 17, fontWeight: '800', flexShrink: 1 },
  follow: {
    minHeight: hit,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingVertical: space(2.5),
    paddingHorizontal: space(3),
    backgroundColor: colors.surface,
  },
  followOn: { borderColor: colors.pro, backgroundColor: colors.proGlow },
  followText: { color: colors.textMuted, fontWeight: '700', fontSize: 13, textAlign: 'center' },
  notice: { color: colors.textDim, fontSize: 11, lineHeight: 15, textAlign: 'center' },
});
