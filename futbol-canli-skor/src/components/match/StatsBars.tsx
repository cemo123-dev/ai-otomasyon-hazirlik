import { StyleSheet, Text, View } from 'react-native';
import type { Match, TeamStats } from '@/lib/types';
import { colors, radius, space } from '@/theme';
import { Card, CardTitle } from '../ui';

type Row = { key: keyof TeamStats; label: string; fmt?: (v: number) => string };

const GROUPS: { title: string; kicker: string; rows: Row[] }[] = [
  {
    kicker: 'KONTROL',
    title: 'Topla Oynama & Pas',
    rows: [
      { key: 'possession', label: 'Topla oynama', fmt: (v) => `%${v}` },
      { key: 'passes_accuracy', label: 'Pas isabeti', fmt: (v) => `%${v}` },
    ],
  },
  {
    kicker: 'TEHDİT',
    title: 'xG & Şutlar',
    rows: [
      { key: 'xg', label: 'xG (Gol beklentisi)', fmt: (v) => v.toFixed(2) },
      { key: 'shots_total', label: 'Toplam şut' },
      { key: 'shots_on_target', label: 'İsabetli şut' },
      { key: 'shots_inside_box', label: 'Ceza sahası içi şut' },
      { key: 'shots_outside_box', label: 'Ceza sahası dışı şut' },
    ],
  },
  {
    kicker: 'DİĞER',
    title: 'Duran Top & Disiplin',
    rows: [
      { key: 'corners', label: 'Korner' },
      { key: 'fouls', label: 'Faul' },
    ],
  },
];

/** Sekme 2: karşılaştırmalı yatay bar grafikleri */
export function StatsBars({ match }: { match: Match }) {
  if (!match.stats) {
    return (
      <Card>
        <Text style={{ color: colors.textMuted }}>İstatistikler maç başladığında görünecek.</Text>
      </Card>
    );
  }
  const { home, away } = match.stats;

  return (
    <View style={{ gap: space(3) }}>
      <View style={styles.legend}>
        <Text style={[styles.legendText, { color: colors.home }]}>● {match.home_team}</Text>
        <Text style={[styles.legendText, { color: colors.away }]}>{match.away_team} ●</Text>
      </View>
      {GROUPS.map((g) => (
        <Card key={g.title}>
          <CardTitle kicker={g.kicker} title={g.title} />
          {g.rows.map((r) => (
            <CompareBar key={r.key} label={r.label} home={home[r.key]} away={away[r.key]} fmt={r.fmt} />
          ))}
        </Card>
      ))}
    </View>
  );
}

export function CompareBar({
  label,
  home,
  away,
  fmt = (v: number) => String(v),
}: {
  label: string;
  home: number;
  away: number;
  fmt?: (v: number) => string;
}) {
  const total = home + away || 1;
  const hp = (home / total) * 100;
  const ap = (away / total) * 100;
  const homeLeads = home > away;
  const awayLeads = away > home;

  return (
    <View style={{ gap: 6 }}>
      <View style={styles.labels}>
        <Text style={[styles.value, homeLeads && { color: colors.home }]}>{fmt(home)}</Text>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.value, awayLeads && { color: colors.away }]}>{fmt(away)}</Text>
      </View>
      <View style={styles.track}>
        <View style={styles.half}>
          <View style={[styles.fill, { width: `${hp}%`, backgroundColor: colors.home, opacity: homeLeads ? 1 : 0.45, alignSelf: 'flex-end' }]} />
        </View>
        <View style={styles.half}>
          <View style={[styles.fill, { width: `${ap}%`, backgroundColor: colors.away, opacity: awayLeads ? 1 : 0.45 }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  legend: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: space(1) },
  legendText: { fontSize: 12, fontWeight: '700' },
  labels: { flexDirection: 'row', alignItems: 'center' },
  value: { color: colors.text, fontWeight: '800', fontSize: 14, width: 52, fontVariant: ['tabular-nums'] },
  label: { flex: 1, textAlign: 'center', color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  track: { flexDirection: 'row', gap: 4, height: 8 },
  half: { flex: 1, backgroundColor: colors.surfaceAlt, borderRadius: radius.sm, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.sm },
});
