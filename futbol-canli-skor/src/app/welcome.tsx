import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SegmentedTabs } from '@/components/SegmentedTabs';
import { TeamLogo } from '@/components/TeamLogo';
import { teamKey, useFollows } from '@/hooks/useFollows';
import { dataSource } from '@/lib/data';
import { friendlyError } from '@/lib/errors';
import { markOnboardingSeen } from '@/lib/onboarding';
import type { FollowedTeam, Match, Sport } from '@/lib/types';
import { colors, hit, radius, space } from '@/theme';

/**
 * F5 ilk açılış: takım seçimi (docs/inovasyon-onerileri.md F5). Liste dün / bugün / yarının maçlarından
 * çıkar (matches tablosu; API-Sports'a ek istek yok). En çok 5 takım; "Atla" ile geçilir. Seçilenler
 * mevcut toggle_team_follow ile takibe alınır; ilk takipte bildirim izni FollowsProvider'da istenir.
 */
const MAX_TEAMS = 5;

const SPORTS: { key: Sport; label: string }[] = [
  { key: 'football', label: '⚽ Futbol' },
  { key: 'nba', label: '🏀 NBA' },
];

type TeamOption = FollowedTeam & { key: string; league: string; priority: number };

/** Maçlardan tekil takım listesi: önce lig önceliği (Süper Lig başta), sonra ad */
function teamsFrom(matches: Match[]): TeamOption[] {
  const map = new Map<string, TeamOption>();
  for (const m of matches) {
    for (const side of ['home', 'away'] as const) {
      const id = side === 'home' ? m.home_team_id : m.away_team_id;
      if (id == null) continue;
      const key = teamKey(m.sport_type, id);
      const prev = map.get(key);
      if (prev && prev.priority <= m.league_priority) continue;
      map.set(key, {
        key,
        sport_type: m.sport_type,
        team_id: id,
        team_name: side === 'home' ? m.home_team : m.away_team,
        team_logo: (side === 'home' ? m.home_logo : m.away_logo) ?? null,
        league: m.league_name,
        priority: m.league_priority,
      });
    }
  }
  return [...map.values()].sort((a, b) => a.priority - b.priority || a.team_name.localeCompare(b.team_name, 'tr'));
}

const norm = (s: string) => s.toLocaleLowerCase('tr').trim();

export default function WelcomeScreen() {
  const { teams, toggleTeam } = useFollows();
  const [sport, setSport] = useState<Sport>('football');
  const [lists, setLists] = useState<Partial<Record<Sport, TeamOption[]>>>({});
  // Spor başına yükleme hatası; "Tekrar dene" hatayı siler, etki listeyi yeniden ister
  const [errors, setErrors] = useState<Partial<Record<Sport, string>>>({});
  const inFlight = useRef(new Set<Sport>());
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<Map<string, TeamOption>>(new Map());
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Ekran bir kez gösterilir: açıldığı an işaretlenir (geri tuşu / uygulamayı kapatmak da "Atla" sayılır)
  useEffect(() => {
    void markOnboardingSeen();
  }, []);

  useEffect(() => {
    if (lists[sport] || errors[sport] || inFlight.current.has(sport)) return;
    const s = sport;
    inFlight.current.add(s);
    dataSource
      .listMatches(s, 1)
      .then((ms) => setLists((prev) => ({ ...prev, [s]: teamsFrom(ms) })))
      .catch((e) => setErrors((prev) => ({ ...prev, [s]: friendlyError(e, 'Takım listesi yüklenemedi.') })))
      .finally(() => inFlight.current.delete(s));
  }, [sport, lists, errors]);
  const loadError = errors[sport] ?? null;

  const all = lists[sport];
  const shown = useMemo(() => {
    const q = norm(query);
    return (all ?? []).filter((t) => !q || norm(t.team_name).includes(q) || norm(t.league).includes(q));
  }, [all, query]);

  const full = picked.size >= MAX_TEAMS;
  const toggle = (t: TeamOption) =>
    setPicked((prev) => {
      const next = new Map(prev);
      if (next.has(t.key)) next.delete(t.key);
      else if (next.size < MAX_TEAMS) next.set(t.key, t);
      return next;
    });

  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const finish = async () => {
    if (!picked.size || busy) return;
    setBusy(true);
    setSaveError(null);
    try {
      // toggle_team_follow çift yönlü: zaten takip edilen takım yeniden gönderilmez (takip bırakılmasın)
      for (const t of picked.values()) {
        if (teams.has(teamKey(t.sport_type, t.team_id))) continue;
        await toggleTeam({ sport_type: t.sport_type, team_id: t.team_id, team_name: t.team_name, team_logo: t.team_logo });
      }
      close();
    } catch (e) {
      // Başarılı olanlar takipte kalır; "Takip et" yeniden basılınca yalnız kalanlar gönderilir
      setSaveError(friendlyError(e, 'Takımlar takibe alınamadı. Tekrar dene.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          Takımlarını seç
        </Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Atla" onPress={close} hitSlop={6} style={styles.skip}>
          <Text style={styles.skipText}>Atla</Text>
        </Pressable>
      </View>
      <Text style={styles.lead}>
        {`En fazla ${MAX_TEAMS} takım seç. Maçları "★ Takip" filtresinde toplanır; takımın oynayınca bildirim gönderelim.`}
      </Text>

      <View style={styles.block}>
        <SegmentedTabs items={SPORTS} value={sport} onChange={setSport} />
      </View>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Takım ara"
        placeholderTextColor={colors.textDim}
        accessibilityLabel="Takım ara"
        autoCorrect={false}
        style={styles.search}
      />

      {loadError ? (
        <View style={styles.center}>
          <Text style={styles.muted}>{loadError}</Text>
          <Pressable accessibilityRole="button" onPress={() => setErrors((prev) => ({ ...prev, [sport]: undefined }))} style={styles.secondary}>
            <Text style={styles.secondaryText}>Tekrar dene</Text>
          </Pressable>
        </View>
      ) : !all ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.live} />
        </View>
      ) : (
        <FlatList
          data={shown}
          keyExtractor={(t) => t.key}
          style={{ flex: 1 }}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <Text style={styles.muted}>
              {query.trim()
                ? `"${query.trim()}" bulunamadı. Liste dün, bugün ve yarının maçlarından oluşur; takımını sonra maç ekranındaki ☆ Takip et ile ekleyebilirsin.`
                : 'Şu an listede maç yok. Takımlarını sonra maç ekranındaki ☆ Takip et ile ekleyebilirsin.'}
            </Text>
          }
          renderItem={({ item: t }) => {
            const on = picked.has(t.key);
            const already = teams.has(t.key);
            const disabled = !on && full;
            return (
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on, disabled }}
                aria-checked={on}
                accessibilityLabel={`${t.team_name}, ${t.league}${already ? ', zaten takipte' : ''}`}
                disabled={disabled}
                onPress={() => toggle(t)}
                style={({ pressed }) => [styles.row, on && styles.rowOn, disabled && { opacity: 0.4 }, pressed && { opacity: 0.8 }]}
              >
                <TeamLogo uri={t.team_logo} name={t.team_name} size={32} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.name} numberOfLines={2}>
                    {t.team_name}
                  </Text>
                  <Text style={styles.league} numberOfLines={1}>
                    {already ? `${t.league} · takipte` : t.league}
                  </Text>
                </View>
                <View style={[styles.box, on && styles.boxOn]}>{on ? <Text style={styles.check}>✓</Text> : null}</View>
              </Pressable>
            );
          }}
        />
      )}

      <View style={styles.footer}>
        {full ? <Text style={styles.hint}>{`En fazla ${MAX_TEAMS} takım. Diğerlerini sonra maç ekranından ekleyebilirsin.`}</Text> : null}
        {saveError ? <Text style={styles.error}>{saveError}</Text> : null}
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !picked.size || busy, busy }}
          disabled={!picked.size || busy}
          onPress={finish}
          style={({ pressed }) => [styles.primary, (!picked.size || busy) && { opacity: 0.4 }, pressed && { opacity: 0.85 }]}
        >
          {busy ? (
            <ActivityIndicator color={colors.onFill} />
          ) : (
            <Text style={styles.primaryText}>{picked.size ? `Takip et (${picked.size}/${MAX_TEAMS})` : 'Takım seç'}</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: space(3), paddingHorizontal: space(4), paddingTop: space(4) },
  title: { flex: 1, color: colors.text, fontSize: 26, lineHeight: 32, fontWeight: '900' },
  skip: { minHeight: hit, minWidth: hit, paddingHorizontal: space(2), alignItems: 'center', justifyContent: 'center' },
  skipText: { color: colors.accent, fontSize: 15, fontWeight: '700' },
  lead: { color: colors.textMuted, fontSize: 14, lineHeight: 20, paddingHorizontal: space(4), marginTop: space(1) },
  block: { paddingHorizontal: space(4), marginTop: space(4) },
  search: {
    marginHorizontal: space(4),
    marginTop: space(3),
    minHeight: hit,
    color: colors.text,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: space(3),
    paddingVertical: space(2),
    fontSize: 15,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space(3), padding: space(4) },
  list: { padding: space(4), gap: space(2) },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(3),
    minHeight: 56,
    paddingHorizontal: space(3),
    paddingVertical: space(2),
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowOn: { borderColor: colors.live, backgroundColor: colors.liveGlow },
  name: { color: colors.text, fontSize: 15, lineHeight: 20, fontWeight: '700' },
  league: { color: colors.textMuted, fontSize: 12, lineHeight: 17 },
  box: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  boxOn: { backgroundColor: colors.live, borderColor: colors.live },
  check: { color: colors.onFill, fontWeight: '900', fontSize: 14, lineHeight: 18 },
  muted: { color: colors.textMuted, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  footer: { paddingHorizontal: space(4), paddingTop: space(2), paddingBottom: space(3), gap: space(2), borderTopWidth: 1, borderTopColor: colors.border },
  hint: { color: colors.warning, fontSize: 12, lineHeight: 17 },
  error: { color: colors.danger, fontSize: 13, lineHeight: 18 },
  primary: { minHeight: 48, borderRadius: radius.md, backgroundColor: colors.live, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space(4), paddingVertical: space(2) },
  primaryText: { color: colors.onFill, fontSize: 15, fontWeight: '800', textAlign: 'center' },
  secondary: { minHeight: 44, borderRadius: radius.md, backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space(4) },
  secondaryText: { color: colors.text, fontSize: 14, fontWeight: '700' },
});
