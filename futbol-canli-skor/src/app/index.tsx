import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, SectionList, StyleSheet, Text, View, type ScrollViewInstance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FollowErrorNotice } from '@/components/FollowErrorNotice';
import { MatchRow } from '@/components/MatchRow';
import { SegmentedTabs } from '@/components/SegmentedTabs';
import { SkeletonList } from '@/components/SkeletonList';
import { Badge, InfoStrip, StateMessage } from '@/components/ui';
import { useApiPaid, useFixtureDaysAhead } from '@/hooks/useApiPaid';
import { usePremium } from '@/hooks/usePremium';
import { useFollows } from '@/hooks/useFollows';
import { useMatches, type MatchFilter } from '@/hooks/useMatches';
import { DAY_OFFSETS, dayLabel, dayOffsetsFor, type DayOffset } from '@/lib/days';
import { PREVIEW_MODE } from '@/lib/supabase';
import type { Sport } from '@/lib/types';
import { colors, hit, radius, space } from '@/theme';

const SPORTS: { key: Sport; label: string }[] = [
  { key: 'football', label: '⚽ Futbol' },
  { key: 'nba', label: '🏀 NBA' },
];

const FILTERS: { key: MatchFilter; label: string }[] = [
  { key: 'all', label: 'Tümü' },
  { key: 'live', label: 'Canlı' },
  { key: 'finished', label: 'Biten' },
  { key: 'followed', label: '★ Takip' },
];

export default function MatchesScreen() {
  const [sport, setSport] = useState<Sport>('football');
  const [filter, setFilter] = useState<MatchFilter>('all');
  // Tarih şeridi: Dün / Bugün / Yarın (ücretsiz API planı ±1 gün verir); ücretli futbol planı doğrulanınca
  // −1…+7 (0018). NBA ücretsiz kalır: hep ±1. Varsayılan Bugün.
  const [pickedDay, setDay] = useState<DayOffset>(0);
  const footballPaid = useApiPaid('football');
  const fixtureDays = useFixtureDaysAhead(footballPaid === true);
  const offsets = sport === 'football' ? dayOffsetsFor(footballPaid, fixtureDays) : DAY_OFFSETS;
  // Spor değişince (ör. futbolda +5 seçiliyken NBA) şeritte olmayan gün Bugün'e döner
  const day: DayOffset = offsets.includes(pickedDay) ? pickedDay : 0;
  const { followed, teams } = useFollows();
  const followSets = useMemo(() => ({ fixtures: followed, teams: new Set(teams.keys()) }), [followed, teams]);
  const { groups, liveCount, loading, error, refreshError, reload } = useMatches(
    sport,
    filter,
    followSets,
    day,
    offsets[offsets.length - 1],
  );
  const { isPremium, isTestUser } = usePremium();
  // Pro satışta değil: test kullanıcısı dışında hap "yakında" der (fiyat/satın alma vaadi yok)
  const proLabel = isPremium ? '✦ PRO' : isTestUser ? "Pro'ya geç" : '✦ Pro · yakında';
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.brand}>
            Skor<Text style={{ color: colors.live }}>+</Text>
          </Text>
          <View style={styles.dateRow}>
            {/* Önizleme rozeti yanında kısa gün adı; büyük yazıda kırpılmak yerine 2. satıra iner (Döngü 5, bulgu 5) */}
            <Text style={styles.date} numberOfLines={2}>
              {new Date().toLocaleDateString('tr-TR', { weekday: PREVIEW_MODE ? 'short' : 'long', day: 'numeric', month: 'long' })}
            </Text>
            {PREVIEW_MODE ? <Badge label="ÖNİZLEME" color={colors.warning} /> : null}
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Bildirim ayarları"
          onPress={() => router.push('/settings')}
          style={styles.settingsBtn}
        >
          <Text style={styles.settingsIcon}>⚙️</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isPremium ? 'Pro üyelik: aktif' : isTestUser ? "Pro'ya geç" : 'Pro, yakında'}
          hitSlop={4}
          onPress={() => router.push('/paywall')}
          style={[styles.proBtn, isPremium && { backgroundColor: colors.pro }]}
        >
          <Text style={[styles.proText, isPremium && { color: colors.onFill }]} numberOfLines={1}>
            {proLabel}
          </Text>
        </Pressable>
      </View>

      <View style={styles.sport}>
        <SegmentedTabs items={SPORTS} value={sport} onChange={setSport} />
      </View>

      <DayStrip offsets={offsets} day={day} onChange={setDay} />

      <View style={styles.filters} accessibilityRole="tablist">
        {FILTERS.map((f) => {
          const active = f.key === filter;
          return (
            <Pressable
              key={f.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={f.key === 'live' && liveCount ? `Canlı, ${liveCount} maç` : f.label.replace('★ ', '')}
              hitSlop={{ top: 2, bottom: 2 }}
              onPress={() => setFilter(f.key)}
              style={[styles.chip, active && styles.chipActive]}
            >
              {f.key === 'live' ? <View style={styles.chipDot} /> : null}
              <Text style={[styles.chipText, active && { color: colors.onFill }]}>
                {f.label}
                {f.key === 'live' && liveCount ? ` · ${liveCount}` : ''}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {filter === 'live' ? (
        // Pazarlama Sürüm 3 §7: futbol metni YALNIZ ücretli plan doğrulanınca F1 aşamasına geçer (dakika rakamı yok);
        // NBA ücretsiz kalır (~30 dk). İki spor tek cümlede birleşmez: not seçili sporu anlatır.
        <Text style={styles.freshNote}>
          {sport === 'football' && footballPaid === true
            ? 'ⓘ Futbolda maç sırasında skorlar sık güncellenir; her maçta son güncelleme saati yazar.'
            : 'ⓘ Ücretsiz veri kaynağı nedeniyle canlı skorlar ~30 dk aralıkla güncellenir; her maçta son güncelleme saati yazar.'}
        </Text>
      ) : null}

      {PREVIEW_MODE ? <PreviewBanner /> : null}

      <FollowErrorNotice />

      {refreshError && !loading ? (
        // Arka plan yenilemesi başarısız: yüklü liste kalır, üstünde kısa uyarı (sonraki başarılı yüklemede kalkar)
        <InfoStrip
          style={styles.refreshNotice}
          title="Liste yenilenemedi"
          body="Son yüklenen maçlar gösteriliyor. Aşağı çekerek tekrar dene."
        />
      ) : null}

      {loading ? (
        // İlk yükleme / gün-spor değişimi (veri yok): listenin şekli (tasarım tur 3 §D-1). Çekerek yenileme ayrı.
        <SkeletonList sport={sport} />
      ) : error ? (
        // Hata çıkmaz sokak olmasın: buton + çekip yenileme (uygulama öne gelince de otomatik denenir)
        <ScrollView
          contentContainerStyle={styles.errorBox}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.live} />}
        >
          <Text style={styles.errorIcon}>⚠</Text>
          <Text style={styles.errorTitle}>Maçlar yüklenemedi</Text>
          <Text style={styles.errorText} accessibilityRole="alert">
            {error}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Maçları yeniden yükle"
            disabled={refreshing}
            onPress={onRefresh}
            style={({ pressed }) => [styles.retryBtn, (pressed || refreshing) && { opacity: 0.7 }]}
          >
            {refreshing ? <ActivityIndicator color={colors.onFill} size="small" /> : <Text style={styles.retryText}>Tekrar dene</Text>}
          </Pressable>
          <Text style={styles.errorHint}>Aşağı çekerek de yenileyebilirsin.</Text>
        </ScrollView>
      ) : (
        <SectionList
          sections={groups}
          keyExtractor={(m) => String(m.fixture_id)}
          renderItem={({ item }) => <MatchRow match={item} />}
          renderSectionHeader={({ section }) => (
            <View style={styles.leagueHeader}>
              <Text style={styles.leagueName}>{section.league_name}</Text>
              {section.league_country ? <Text style={styles.leagueCountry}>{section.league_country}</Text> : null}
            </View>
          )}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          // Lig grubu kartı alt köşelerde de yuvarlak kapanır
          renderSectionFooter={() => <View style={styles.leagueFooter} />}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            filter === 'followed' ? (
              <StateMessage title="Takip ettiğin maç yok" body="🔔 zil veya ☆ Takip et ile ekleyebilirsin." />
            ) : filter === 'live' ? (
              <StateMessage
                title={day === 0 ? 'Şu an canlı maç yok' : `${dayLabel(day).title} için canlı maç yok`}
                action="Tüm maçlar"
                primary={false}
                onAction={() => setFilter('all')}
              />
            ) : (
              <StateMessage
                title={`${dayLabel(day).title} için bu filtrede maç yok.`}
                action={filter !== 'all' ? 'Tüm maçlar' : undefined}
                primary={false}
                onAction={filter !== 'all' ? () => setFilter('all') : undefined}
              />
            )
          }
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.live} />}
        />
      )}
    </SafeAreaView>
  );
}

/**
 * Tarih şeridi. 3 gün (ücretsiz plan / NBA): eşit genişlikte tek satır (eskisiyle aynı).
 * 9 gün (ücretli futbol): yatay kaydırılır; seçili gün görünür alana kaydırılır.
 */
function DayStrip({ offsets, day, onChange }: { offsets: DayOffset[]; day: DayOffset; onChange: (d: DayOffset) => void }) {
  const scroll = useRef<ScrollViewInstance>(null);
  const xs = useRef(new Map<DayOffset, number>());
  const wide = offsets.length > 3;
  useEffect(() => {
    if (!wide) return;
    const x = xs.current.get(day);
    if (x != null) scroll.current?.scrollTo({ x: Math.max(0, x - space(4)), animated: true });
  }, [day, wide]);
  const items = offsets.map((d) => {
    const active = d === day;
    const { title, sub } = dayLabel(d);
    return (
      <Pressable
        key={d}
        accessibilityRole="tab"
        accessibilityState={{ selected: active }}
        accessibilityLabel={`${title}, ${sub}`}
        onPress={() => onChange(d)}
        onLayout={wide ? (e) => xs.current.set(d, e.nativeEvent.layout.x) : undefined}
        style={[styles.dayBtn, wide && styles.dayBtnWide, active && styles.dayBtnActive]}
      >
        <Text style={[styles.dayTitle, active && { color: colors.live }]}>{title}</Text>
        <Text style={styles.daySub}>{sub}</Text>
      </Pressable>
    );
  });
  if (!wide) {
    return (
      <View style={styles.days} accessibilityRole="tablist">
        {items}
      </View>
    );
  }
  return (
    <ScrollView
      ref={scroll}
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityRole="tablist"
      style={styles.daysScroll}
      contentContainerStyle={styles.days}
    >
      {items}
    </ScrollView>
  );
}

/** Önizleme kipi uyarısı: tek satır + "Ayrıntı" aç/kapa (tasarım tur 1 madde 21; liste aşağı itilmesin) */
function PreviewBanner() {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.previewBanner}>
      <View style={styles.previewRow}>
        <Text style={styles.previewTitle}>⚠ Örnek veri · gerçek maç değil</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          accessibilityLabel={open ? 'Önizleme açıklamasını gizle' : 'Önizleme açıklamasını göster'}
          hitSlop={{ top: 13, bottom: 13, left: 8, right: 8 }} // 18 pt metin + 26 = 44 pt
          onPress={() => setOpen((v) => !v)}
        >
          <Text style={styles.previewMore}>{open ? 'Gizle' : 'Ayrıntı'}</Text>
        </Pressable>
      </View>
      {open ? (
        <Text style={styles.previewText}>
          Takımlar, skorlar ve dakikalar arayüzü denemek için uydurulmuştur. Gerçek canlı maçlar Supabase ve API-Football
          bağlantısı kurulunca gelir.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: space(2), paddingHorizontal: space(4), paddingTop: space(2), paddingBottom: space(3) },
  brand: { color: colors.text, fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: space(2), marginTop: 2 },
  date: { flexShrink: 1, color: colors.textMuted, fontSize: 13 },
  settingsBtn: { width: hit, height: hit, alignItems: 'center', justifyContent: 'center' },
  settingsIcon: { fontSize: 18 },
  proBtn: {
    minHeight: 36,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.pro,
    borderRadius: radius.pill,
    paddingHorizontal: space(3),
  },
  proText: { color: colors.pro, fontWeight: '800', fontSize: 13 },
  sport: { paddingHorizontal: space(4), paddingBottom: space(3) },
  days: { flexDirection: 'row', gap: space(2), paddingHorizontal: space(4), paddingBottom: space(3) },
  dayBtn: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingVertical: space(1.5), borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.surface },
  // Kaydırılan şerit: sabit genişlik (flex: 1 yatay ScrollView'da çalışmaz); büyük yazıda genişler
  dayBtnWide: { flex: 0, minWidth: 64, paddingHorizontal: space(2) },
  // flexShrink 0: alttaki uzun içerik (iskelet, liste) yatay şeridi sıfır yüksekliğe ezmesin
  daysScroll: { flexGrow: 0, flexShrink: 0 },
  dayBtnActive: { borderColor: colors.live, backgroundColor: colors.liveGlow },
  dayTitle: { color: colors.text, fontWeight: '800', fontSize: 13 },
  daySub: { color: colors.textMuted, fontSize: 11, marginTop: 1 },
  freshNote: { color: colors.textMuted, fontSize: 12, lineHeight: 17, paddingHorizontal: space(4), paddingBottom: space(3) },
  // Büyük sistem yazı tipinde dar ekranda taşmasın
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: space(2), paddingHorizontal: space(4), paddingBottom: space(3) },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 40, paddingHorizontal: space(3.5), paddingVertical: space(2), borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderStrong },
  chipActive: { backgroundColor: colors.text, borderColor: colors.text },
  chipDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.live },
  chipText: { color: colors.text, fontWeight: '700', fontSize: 13 },
  list: { paddingHorizontal: space(4), paddingBottom: space(10) },
  leagueHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: space(2),
    backgroundColor: colors.surface,
    paddingHorizontal: space(4),
    paddingTop: space(3),
    paddingBottom: space(2),
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  leagueName: { color: colors.text, fontWeight: '800', fontSize: 14 },
  leagueCountry: { color: colors.textMuted, fontSize: 12 },
  sep: { height: 1, backgroundColor: colors.border },
  leagueFooter: {
    height: space(2),
    backgroundColor: colors.surface,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
    marginBottom: space(3),
  },
  // Tasarım B-5: önizleme bandından ayrışsın; sol 3 px turuncu şerit, nötr zemin, başlık + açıklama
  refreshNotice: { marginHorizontal: space(4), marginBottom: space(3) },
  errorBox: { alignItems: 'center', gap: space(3), paddingTop: space(10), paddingHorizontal: space(6), paddingBottom: space(10) },
  errorIcon: { fontSize: 28, color: colors.warning },
  errorTitle: { color: colors.text, fontSize: 17, lineHeight: 22, fontWeight: '800', textAlign: 'center' },
  errorText: { color: colors.textMuted, textAlign: 'center', lineHeight: 20, fontSize: 14 },
  errorHint: { color: colors.textDim, textAlign: 'center', lineHeight: 17, fontSize: 12 },
  retryBtn: {
    minWidth: 160,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.live,
    borderRadius: radius.md,
    paddingHorizontal: space(5),
    marginTop: space(1),
  },
  retryText: { color: colors.onFill, fontWeight: '800', fontSize: 15 },
  previewBanner: {
    marginHorizontal: space(4),
    marginBottom: space(3),
    padding: space(3),
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.warning,
    backgroundColor: 'rgba(255,162,58,0.08)',
    gap: 2,
  },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: space(2), minHeight: 28 },
  previewTitle: { flex: 1, color: colors.warning, fontWeight: '800', fontSize: 13 },
  previewMore: { color: colors.accent, fontWeight: '700', fontSize: 13 },
  previewText: { color: colors.textMuted, fontSize: 12, lineHeight: 17 },
});
