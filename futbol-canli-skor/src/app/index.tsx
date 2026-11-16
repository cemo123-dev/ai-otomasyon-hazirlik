import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MatchRow } from '@/components/MatchRow';
import { Badge } from '@/components/ui';
import { usePremium } from '@/hooks/usePremium';
import { useMatches, type MatchFilter } from '@/hooks/useMatches';
import { PREVIEW_MODE } from '@/lib/supabase';
import { colors, radius, space } from '@/theme';

const FILTERS: { key: MatchFilter; label: string }[] = [
  { key: 'all', label: 'Tümü' },
  { key: 'live', label: 'Canlı' },
  { key: 'finished', label: 'Biten' },
];

export default function MatchesScreen() {
  const [filter, setFilter] = useState<MatchFilter>('all');
  const { groups, liveCount, loading, error, reload } = useMatches(filter);
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
          onPress={() => router.push('/paywall')}
          style={[styles.proBtn, isPremium && { backgroundColor: colors.pro }]}
        >
          <Text style={[styles.proText, isPremium && { color: colors.bg }]}>{isPremium ? '✦ PRO' : 'Pro’ya geç'}</Text>
        </Pressable>
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
          ListEmptyComponent={<Text style={styles.empty}>Bu filtrede maç yok.</Text>}
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
  proBtn: { borderWidth: 1, borderColor: colors.pro, borderRadius: 999, paddingHorizontal: space(3), paddingVertical: space(1.5) },
  proText: { color: colors.pro, fontWeight: '800', fontSize: 12 },
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
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: space(10) },
});
