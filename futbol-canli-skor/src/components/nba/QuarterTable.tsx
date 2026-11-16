import { StyleSheet, Text, View } from 'react-native';
import { isLive, type Match } from '@/lib/types';
import { colors, radius, space } from '@/theme';

const head = (i: number) => (i < 4 ? `Q${i + 1}` : `UZ${i - 3}`);

/**
 * Çeyrek skor tablosu: Q1 | Q2 | Q3 | Q4 | (UZ) | Toplam
 * compact: maç listesindeki kart için tek satırlık küçük görünüm
 */
export function QuarterTable({ match: m, compact }: { match: Match; compact?: boolean }) {
  const ps = m.period_scores;
  if (!ps) return null;
  const n = Math.max(4, ps.home.length, ps.away.length);
  const live = isLive(m.status_short);
  const current = live ? (m.elapsed_minute ?? ps.home.length) - 1 : -1;

  if (compact) {
    const parts = Array.from({ length: Math.max(ps.home.length, ps.away.length) }, (_, i) =>
      `${head(i)} ${ps.home[i] ?? '-'}-${ps.away[i] ?? '-'}`,
    );
    return (
      <Text style={styles.compact} numberOfLines={1}>
        {parts.join('  ·  ')}
      </Text>
    );
  }

  const cols = Array.from({ length: n }, (_, i) => i);
  const row = (side: 'home' | 'away', name: string) => {
    const vals = ps[side];
    const other = side === 'home' ? ps.away : ps.home;
    return (
      <View style={styles.row}>
        <Text style={[styles.team, side === 'home' ? { color: colors.home } : { color: colors.away }]} numberOfLines={1}>
          {name}
        </Text>
        {cols.map((i) => {
          const v = vals[i];
          const won = v != null && other[i] != null && v > other[i];
          return (
            <Text key={i} style={[styles.cell, won && styles.cellWon, i === current && styles.cellLive]}>
              {v ?? '–'}
            </Text>
          );
        })}
        <Text style={[styles.cell, styles.total]}>{side === 'home' ? (m.home_score ?? '–') : (m.away_score ?? '–')}</Text>
      </View>
    );
  };

  return (
    <View style={styles.table}>
      <View style={styles.row}>
        <Text style={[styles.team, styles.headText]}>Takım</Text>
        {cols.map((i) => (
          <Text key={i} style={[styles.cell, styles.headText, i === current && { color: colors.live }]}>
            {head(i)}
          </Text>
        ))}
        <Text style={[styles.cell, styles.headText]}>Top.</Text>
      </View>
      {row('home', m.home_team)}
      {row('away', m.away_team)}
    </View>
  );
}

const styles = StyleSheet.create({
  compact: { color: colors.textMuted, fontSize: 11, fontVariant: ['tabular-nums'], marginTop: 4 },
  table: { borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: space(2), paddingHorizontal: space(2), borderTopWidth: 1, borderTopColor: colors.border },
  team: { flex: 1, fontSize: 13, fontWeight: '800', color: colors.text },
  headText: { color: colors.textMuted, fontSize: 11, fontWeight: '800' },
  cell: { width: 36, textAlign: 'center', color: colors.textMuted, fontSize: 13, fontWeight: '600', fontVariant: ['tabular-nums'] },
  cellWon: { color: colors.text, fontWeight: '800' },
  cellLive: { color: colors.live },
  total: { width: 44, color: colors.text, fontWeight: '900', fontSize: 15 },
});
