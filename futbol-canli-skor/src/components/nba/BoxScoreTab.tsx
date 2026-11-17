import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { isLive, type Match, type NbaBoxLine } from '@/lib/types';
import { colors, space } from '@/theme';
import { SegmentedTabs } from '../SegmentedTabs';
import { TeamLogo } from '../TeamLogo';
import { Card } from '../ui';

type Col = { key: string; label: string; get: (p: NbaBoxLine) => string; width: number };

const ma = (m?: number, a?: number) => `${m ?? 0}-${a ?? 0}`;
const COLS: Col[] = [
  { key: 'min', label: 'DK', get: (p) => String(p.minutes), width: 34 },
  { key: 'pts', label: 'SAY', get: (p) => String(p.points), width: 38 },
  { key: 'reb', label: 'RİB', get: (p) => String(p.rebounds), width: 36 },
  { key: 'ast', label: 'AST', get: (p) => String(p.assists), width: 36 },
  { key: 'fg', label: 'SAHA', get: (p) => ma(p.fgm, p.fga), width: 50 },
  { key: '3p', label: 'ÜÇ', get: (p) => ma(p.tpm, p.tpa), width: 44 },
  { key: 'ft', label: 'SA', get: (p) => ma(p.ftm, p.fta), width: 44 },
  { key: 'stl', label: 'TÇ', get: (p) => String(p.steals ?? 0), width: 32 },
  { key: 'blk', label: 'BLK', get: (p) => String(p.blocks ?? 0), width: 36 },
  { key: 'to', label: 'TK', get: (p) => String(p.turnovers ?? 0), width: 32 },
  { key: 'pf', label: 'F', get: (p) => String(p.fouls ?? 0), width: 28 },
  { key: 'pm', label: '+/-', get: (p) => (p.plus_minus > 0 ? `+${p.plus_minus}` : String(p.plus_minus)), width: 40 },
];

const NAME_W = 132;

const sum = (rows: NbaBoxLine[], k: keyof NbaBoxLine) => rows.reduce((t, r) => t + (Number(r[k]) || 0), 0);

/** NBA "Box Score" sekmesi: takım seçimi, ilk 5 / yedekler, takım toplamı (yatay kaydırmalı tablo) */
export function BoxScoreTab({ match }: { match: Match }) {
  const [side, setSide] = useState<'home' | 'away'>('home');
  const box = Array.isArray(match.box_score) ? match.box_score : [];

  if (!box.length) {
    return (
      <Card>
        <Text style={styles.empty}>
          {isLive(match.status_short)
            ? 'Box score maç bitince yüklenir. Canlı skor ve çeyrekler Özet sekmesinde.'
            : match.status_short === 'FT'
              ? 'Box score hazırlanıyor; maçtan kısa süre sonra burada olacak.'
              : 'Box score maç bittiğinde görünecek.'}
        </Text>
      </Card>
    );
  }

  const rows = box.filter((p) => p && p.team === side);
  const starters = rows.filter((p) => p.starter);
  const bench = rows.filter((p) => !p.starter);
  const total: NbaBoxLine = {
    name: 'Takım toplamı',
    team: side,
    starter: false,
    position: '',
    minutes: sum(rows, 'minutes'),
    points: sum(rows, 'points'),
    rebounds: sum(rows, 'rebounds'),
    assists: sum(rows, 'assists'),
    plus_minus: 0,
    fgm: sum(rows, 'fgm'),
    fga: sum(rows, 'fga'),
    tpm: sum(rows, 'tpm'),
    tpa: sum(rows, 'tpa'),
    ftm: sum(rows, 'ftm'),
    fta: sum(rows, 'fta'),
    steals: sum(rows, 'steals'),
    blocks: sum(rows, 'blocks'),
    fouls: sum(rows, 'fouls'),
    turnovers: sum(rows, 'turnovers'),
  };
  const topScorer = rows.reduce<NbaBoxLine | null>((b, p) => (!b || p.points > b.points ? p : b), null);

  return (
    <View style={{ gap: space(3) }}>
      <SegmentedTabs
        items={[
          { key: 'home' as const, label: match.home_team },
          { key: 'away' as const, label: match.away_team },
        ]}
        value={side}
        onChange={setSide}
      />
      <Card>
        <View style={styles.teamHead}>
          <TeamLogo uri={side === 'home' ? match.home_logo : match.away_logo} name={side === 'home' ? match.home_team : match.away_team} size={28} />
          <Text style={styles.teamName}>{side === 'home' ? match.home_team : match.away_team}</Text>
        </View>
        <View style={styles.tableWrap}>
          {/* Sabit oyuncu sütunu */}
          <View style={{ width: NAME_W }}>
            <Text style={[styles.th, styles.nameCell]}>OYUNCU</Text>
            {starters.length ? <Text style={styles.group}>İLK 5</Text> : null}
            {starters.map((p) => <NameCell key={`s-${p.name}`} p={p} top={p === topScorer} />)}
            {bench.length ? <Text style={styles.group}>YEDEKLER</Text> : null}
            {bench.map((p) => <NameCell key={`b-${p.name}`} p={p} top={p === topScorer} />)}
            <Text style={[styles.td, styles.nameCell, styles.totalText]}>{total.name}</Text>
          </View>
          {/* Kaydırılabilir istatistik sütunları */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} accessibilityLabel="Box score tablosu">
            <View>
              <Row cells={COLS.map((c) => ({ w: c.width, v: c.label }))} header />
              {starters.length ? <View style={styles.groupSpacer} /> : null}
              {starters.map((p) => <Row key={`s-${p.name}`} cells={COLS.map((c) => ({ w: c.width, v: c.get(p) }))} />)}
              {bench.length ? <View style={styles.groupSpacer} /> : null}
              {bench.map((p) => <Row key={`b-${p.name}`} cells={COLS.map((c) => ({ w: c.width, v: c.get(p) }))} />)}
              <Row cells={COLS.map((c) => ({ w: c.width, v: c.key === 'pm' ? '' : c.get(total) }))} total />
            </View>
          </ScrollView>
        </View>
        <Text style={styles.legend}>
          DK dakika · SAY sayı · RİB ribaund · AST asist · SAHA isabet-deneme · ÜÇ üçlük · SA serbest atış · TÇ top çalma · BLK blok ·
          TK top kaybı · F faul
        </Text>
      </Card>
    </View>
  );
}

function NameCell({ p, top }: { p: NbaBoxLine; top: boolean }) {
  return (
    <Text style={[styles.td, styles.nameCell, top && { color: colors.pro }]} numberOfLines={1}>
      {p.name}
      {p.position ? <Text style={styles.pos}> {p.position}</Text> : null}
    </Text>
  );
}

function Row({ cells, header, total }: { cells: { w: number; v: string }[]; header?: boolean; total?: boolean }) {
  return (
    <View style={styles.row}>
      {cells.map((c, i) => (
        <Text key={i} style={[header ? styles.th : styles.td, { width: c.w }, styles.num, total && styles.totalText]}>
          {c.v}
        </Text>
      ))}
    </View>
  );
}

const ROW_H = 30;

const styles = StyleSheet.create({
  empty: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  teamHead: { flexDirection: 'row', alignItems: 'center', gap: space(2) },
  teamName: { color: colors.text, fontWeight: '900', fontSize: 16 },
  tableWrap: { flexDirection: 'row' },
  row: { flexDirection: 'row' },
  th: { height: ROW_H, lineHeight: ROW_H, color: colors.textDim, fontSize: 11, fontWeight: '800' },
  td: { height: ROW_H, lineHeight: ROW_H, color: colors.text, fontSize: 13, borderTopWidth: 1, borderTopColor: colors.border },
  num: { textAlign: 'center', fontVariant: ['tabular-nums'] },
  nameCell: { paddingRight: space(2), fontWeight: '700' },
  pos: { color: colors.textDim, fontSize: 11, fontWeight: '600' },
  group: { height: 22, lineHeight: 22, color: colors.textMuted, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  groupSpacer: { height: 22 },
  totalText: { color: colors.text, fontWeight: '900' },
  legend: { color: colors.textDim, fontSize: 11, lineHeight: 16 },
});
