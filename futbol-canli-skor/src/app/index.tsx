import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MatchRow } from '@/components/MatchRow';
import { SegmentedTabs } from '@/components/SegmentedTabs';
import { Badge } from '@/components/ui';
import { usePremium } from '@/hooks/usePremium';
import { useFollows } from '@/hooks/useFollows';
import { useMatches, type MatchFilter } from '@/hooks/useMatches';
import { DAY_OFFSETS, dayLabel, type DayOffset } from '@/lib/days';
import { PREVIEW_MODE } from '@/lib/supabase';
import type { Sport } from '@/lib/types';
import { colors, radius, space } from '@/theme';

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
  // Tarih şeridi: Dün / Bugün / Yarın (ücretsiz API planı ±1 gün verir); varsayılan Bugün
  const [day, setDay] = useState<DayOffset>(0);
  const { followed, teams } = useFollows();
  const followSets = useMemo(() => ({ fixtures: followed, teams: new Set(teams.keys()) }), [followed, teams]);
  const { groups, liveCount, loading, error, reload } = useMatches(sport, filter, followSets, day);
  const { isPremium } = usePremium();
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
          <Text style={styles.date}>
            {new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </Text>
        </View>
        {PREVIEW_MODE ? <Badge label="ÖNİZLEME" color={colors.warning} /> : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Bildirim ayarları"
          hitSlop={8}
          onPress={() => router.push('/settings')}
          style={styles.settingsBtn}
        >
          <Text style={styles.settingsIcon}>⚙️</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push('/paywall')}
          style={[styles.proBtn, isPremium && { backgroundColor: colors.pro }]}
        >
          <Text style={[styles.proText, isPremium && { color: colors.bg }]}>{isPremium ? '✦ PRO' : 'Pro’ya geç'}</Text>
        </Pressable>
      </View>

      <View style={styles.sport}>
        <SegmentedTabs items={SPORTS} value={sport} onChange={setSport} />
      </View>

      <View style={styles.days} accessibilityRole="tablist">
        {DAY_OFFSETS.map((d) => {
          const active = d === day;
          const { title, sub } = dayLabel(d);
          return (
            <Pressable
              key={d}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${title}, ${sub}`}
              onPress={() => setDay(d)}
              style={[styles.dayBtn, active && styles.dayBtnActive]}
            >
              <Text style={[styles.dayTitle, active && { color: colors.live }]}>{title}</Text>
              <Text style={styles.daySub}>{sub}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.filters}>
        {FILTERS.map((f) => {
          const active = f.key === filter;
          return (
            <Pressable key={f.key} onPress={() => setFilter(f.key)} style={[styles.chip, active && styles.chipActive]}>
              {f.key === 'live' ? <View style={styles.chipDot} /> : null}
              <Text style={[styles.chipText, active && { color: colors.bg }]}>
                {f.label}
                {f.key === 'live' && liveCount ? ` · ${liveCount}` : ''}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {filter === 'live' ? (
        <Text style={styles.freshNote}>
          ⓘ Ücretsiz veri kaynağı nedeniyle canlı skorlar ~30 dk aralıkla güncellenir; her maçta son güncelleme saati yazar.
        </Text>
      ) : null}

      {PREVIEW_MODE ? (
        <View style={styles.previewBanner}>
          <Text style={styles.previewTitle}>⚠ Örnek veri: bu maçlar gerçek değil</Text>
          <Text style={styles.previewText}>
            Takımlar, skorlar ve dakikalar arayüzü denemek için uydurulmuştur. Gerçek canlı maçlar Supabase ve
            API-Football bağlantısı kurulunca gelir.
          </Text>
        </View>
      ) : null}

      {loading ? (
        <ActivityIndicator color={colors.live} style={{ marginTop: space(10) }} />
      ) : error ? (
        <Text style={styles.empty}>{error}</Text>
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
          renderSectionFooter={() => <View style={{ height: space(3) }} />}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {filter === 'followed'
                ? 'Takip ettiğin maç yok. Maçlardaki 🔔 zil veya maç ekranındaki ☆ ile takım takip edebilirsin.'
                : `${dayLabel(day).title} için bu filtrede maç yok.`}
            </Text>
          }
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.live} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: space(2), paddingHorizontal: space(4), paddingTop: space(2), paddingBottom: space(3) },
  brand: { color: colors.text, fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  date: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  settingsBtn: { padding: space(1) },
  settingsIcon: { fontSize: 18 },
  proBtn: { borderWidth: 1, borderColor: colors.pro, borderRadius: 999, paddingHorizontal: space(3), paddingVertical: space(1.5) },
  proText: { color: colors.pro, fontWeight: '800', fontSize: 12 },
  sport: { paddingHorizontal: space(4), paddingBottom: space(3) },
  days: { flexDirection: 'row', gap: space(2), paddingHorizontal: space(4), paddingBottom: space(3) },
  dayBtn: { flex: 1, alignItems: 'center', paddingVertical: space(1.5), borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  dayBtnActive: { borderColor: colors.live, backgroundColor: colors.liveGlow },
  dayTitle: { color: colors.text, fontWeight: '800', fontSize: 13 },
  daySub: { color: colors.textMuted, fontSize: 11, marginTop: 1 },
  freshNote: { color: colors.textMuted, fontSize: 12, lineHeight: 17, paddingHorizontal: space(4), paddingBottom: space(3) },
  filters: { flexDirection: 'row', gap: space(2), paddingHorizontal: space(4), paddingBottom: space(3) },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: space(3.5), paddingVertical: space(2), borderRadius: 999, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
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
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: space(10), paddingHorizontal: space(6), lineHeight: 20 },
  previewBanner: {
    marginHorizontal: space(4),
    marginBottom: space(3),
    padding: space(3),
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.warning,
    backgroundColor: 'rgba(255,197,61,0.08)',
    gap: 2,
  },
  previewTitle: { color: colors.warning, fontWeight: '800', fontSize: 13 },
  previewText: { color: colors.textMuted, fontSize: 12, lineHeight: 17 },
});
