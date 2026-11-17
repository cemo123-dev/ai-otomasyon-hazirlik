import { StyleSheet, Text, View } from 'react-native';
import type { Match, NbaEfficiencyVerdict, NbaTacticalPayload } from '@/lib/types';
import { colors, radius, space } from '@/theme';
import { VerdictCard } from '../analysis/AnalysisCards';
import { CompareBar } from '../match/StatsBars';
import { Badge, Card, CardTitle } from '../ui';

type Side = 'home' | 'away';
const teamColor = (t: Side | 'neutral') => (t === 'home' ? colors.home : t === 'away' ? colors.away : colors.textMuted);
const sgn = (n: number) => (n > 0 ? `+${n.toFixed(1)}` : n.toFixed(1));
const f1 = (v: number) => `%${v.toFixed(1)}`;

const VERDICT: Record<NbaEfficiencyVerdict, { label: string; color: string }> = {
  inefficient_volume: { label: 'VERİMSİZ HACİM', color: colors.danger },
  efficient_offense: { label: 'VERİMLİ HÜCUM', color: colors.live },
  balanced: { label: 'DENGELİ', color: colors.accent },
  defensive_grind: { label: 'SAVUNMA SAVAŞI', color: colors.warning },
};

/** Kart 2: TS% ve Hücum Verimliliği Denetimi */
export function EfficiencyCard({ p, match }: { p: NbaTacticalPayload; match: Match }) {
  const e = p.efficiency_audit;
  const v = VERDICT[e.verdict_type];
  const trapName = e.volume_trap_team === 'home' ? match.home_team : e.volume_trap_team === 'away' ? match.away_team : null;
  const col = (side: Side, name: string) => (
    <View style={{ flex: 1, gap: 4 }}>
      <Text style={[styles.teamLabel, { color: teamColor(side) }]} numberOfLines={1}>{name}</Text>
      <Text style={styles.bigNumber}>
        {e[side].ts_pct.toFixed(1)}
        <Text style={styles.unit}> TS%</Text>
      </Text>
      <Text style={styles.meta}>
        {e[side].fga} şut · {e[side].tpa} üçlük denemesi
      </Text>
    </View>
  );
  return (
    <Card>
      <CardTitle kicker="TS% & Hücum Verimliliği" title={e.verdict_label} right={<Badge label={v.label} color={v.color} />} />
      <View style={styles.grid}>
        {col('home', match.home_team)}
        <View style={styles.vDivider} />
        {col('away', match.away_team)}
      </View>
      <CompareBar label="Saha içi (FG%)" home={e.home.fg_pct} away={e.away.fg_pct} fmt={f1} />
      <CompareBar label="Üçlük (3P%)" home={e.home.tp_pct} away={e.away.tp_pct} fmt={f1} />
      {trapName ? (
        <View style={styles.trap}>
          <Text style={styles.trapTitle}>⚠ Verimsiz hacim tuzağı: {trapName}</Text>
          <Text style={styles.bodySmall}>Daha çok şut denedi, daha düşük verimle kaybetti.</Text>
        </View>
      ) : null}
      <Text style={styles.body}>{e.commentary}</Text>
    </Card>
  );
}

/** Kart 3: Çeyrek Kırılmaları (Quarter Runs) */
export function QuarterRunsCard({ p, match }: { p: NbaTacticalPayload; match: Match }) {
  const runs = p.quarter_runs;
  const max = Math.max(1, ...runs.map((r) => Math.abs(r.swing)));
  return (
    <Card>
      <CardTitle kicker="Çeyrek Kırılmaları" title="Momentumun el değiştirdiği periyotlar" />
      {runs.map((r, i) => {
        const side: Side | 'neutral' = r.swing > 0 ? 'home' : r.swing < 0 ? 'away' : 'neutral';
        const c = teamColor(r.momentum);
        const w = `${(Math.abs(r.swing) / max) * 100}%` as const;
        return (
          <View key={i} style={styles.run}>
            <View style={styles.runHead}>
              <Text style={[styles.runQ, { color: c }]}>{r.label}</Text>
              <Badge label={`${r.home_pts}-${r.away_pts}`} color={colors.textMuted} />
              <Text style={styles.meta}>→ {r.score_after}</Text>
            </View>
            <View style={styles.swingTrack}>
              <View style={[styles.swingFill, { width: w, backgroundColor: teamColor(side) }]} />
            </View>
            <Text style={styles.meta}>
              Periyot farkı: {r.swing === 0 ? 'eşit' : `${side === 'home' ? match.home_team : match.away_team} +${Math.abs(r.swing)}`}
            </Text>
            <Text style={styles.runTitle}>{r.title}</Text>
            <Text style={styles.bodySmall}>{r.description}</Text>
          </View>
        );
      })}
      <View style={styles.late}>
        <Text style={styles.lateTitle}>
          Son çeyrek {p.late_game.q4_home ?? '–'}-{p.late_game.q4_away ?? '–'} · final farkı {p.late_game.final_margin}
          {p.late_game.close_game ? ' · yakın maç' : ''}
        </Text>
        <Text style={styles.bodySmall}>{p.late_game.commentary}</Text>
      </View>
    </Card>
  );
}

/** Kart 4: İlk 5 vs Bench (+/-) Etkisi + Maçın Yıldızı */
export function BenchImpactCard({ p, match }: { p: NbaTacticalPayload; match: Match }) {
  const b = p.bench_impact;
  const sp = p.player_performance_spotlight;
  const spColor = teamColor(sp.team);
  const box = (label: string, v: number) => {
    const c = v > 0 ? colors.live : v < 0 ? colors.danger : colors.textMuted;
    return (
      <View style={[styles.pmBox, { borderColor: c }]}>
        <Text style={[styles.pmValue, { color: c }]}>{sgn(v)}</Text>
        <Text style={styles.pmLabel}>{label}</Text>
      </View>
    );
  };
  return (
    <Card>
      <CardTitle kicker="İlk 5 vs Bench" title="+/- etkisi (oyuncu başına ortalama)" />
      {(['home', 'away'] as const).map((side) => (
        <View key={side} style={styles.benchRow}>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={[styles.teamLabel, { color: teamColor(side) }]}>{side === 'home' ? match.home_team : match.away_team}</Text>
            <Text style={styles.meta}>Yedek sayısı: {b[side].bench_points}</Text>
            <Text style={styles.bodySmall}>{b[side].commentary}</Text>
          </View>
          {box('İlk 5', b[side].starters_pm_avg)}
          {box('Bench', b[side].bench_pm_avg)}
        </View>
      ))}

      <View style={[styles.spotlight, { borderColor: spColor }]}>
        <View style={styles.spotHead}>
          <View style={{ flex: 1 }}>
            <Text style={styles.kickerPro}>★ MAÇIN YILDIZI</Text>
            <Text style={styles.headlineSmall}>{sp.player}</Text>
            <Text style={styles.meta}>
              {sp.position} · {sp.team === 'home' ? match.home_team : match.away_team}
            </Text>
          </View>
          <View style={[styles.rating, { backgroundColor: spColor }]}>
            <Text style={styles.ratingText}>{sp.rating}</Text>
            <Text style={styles.ratingLabel}>SAYI</Text>
          </View>
        </View>
        <Text style={styles.bodySmall}>{sp.headline}</Text>
        <View style={styles.statGrid}>
          {sp.key_stats.map((k, i) => (
            <View key={`${i}-${k.label}`} style={styles.statCell}>
              <Text style={styles.statValue}>{k.value}</Text>
              <Text style={styles.statLabel}>{k.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </Card>
  );
}

/** Kart 5: Oyuncu Etkisi (Game Score hücum/savunma) & Faul Problemi */
export function PlayerImpactCard({ p, match }: { p: NbaTacticalPayload; match: Match }) {
  const pi = p.player_impact;
  if (!pi) return null;
  const teamName = (t: Side) => (t === 'home' ? match.home_team : match.away_team);
  const list = (title: string, icon: string, xs: typeof pi.offense) => (
    <View style={{ gap: space(2) }}>
      <Text style={styles.sectionTitle}>
        {icon} {title}
      </Text>
      {xs.map((x, i) => (
        <View key={`${title}-${i}`} style={styles.impactRow}>
          <View style={[styles.rank, { borderColor: teamColor(x.team) }]}>
            <Text style={[styles.rankText, { color: teamColor(x.team) }]}>{i + 1}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.impactName} numberOfLines={1}>
              {x.name} <Text style={[styles.meta, { color: teamColor(x.team) }]}>· {teamName(x.team)}</Text>
            </Text>
            <Text style={styles.meta}>{x.line}</Text>
          </View>
          <Text style={styles.impactScore}>{x.score.toFixed(1)}</Text>
        </View>
      ))}
    </View>
  );

  return (
    <Card>
      <CardTitle kicker="Oyuncu Etkisi" title="Hücum, savunma ve faul problemi" />
      {list('Hücumda en etkili', '🔥', pi.offense)}
      {list('Savunmada en etkili', '🛡', pi.defense)}
      {pi.commentary ? <Text style={styles.body}>{pi.commentary}</Text> : null}

      <View style={styles.foulBox}>
        <Text style={styles.sectionTitle}>⚠ Faul problemi</Text>
        {pi.foul_trouble.length ? (
          <>
            {pi.foul_trouble.map((f, i) => (
              <View key={`f-${i}`} style={styles.foulRow}>
                <Badge label={f.fouled_out ? 'OYUNDAN ATILDI' : `${f.fouls} FAUL`} color={f.fouled_out ? colors.danger : colors.warning} />
                <Text style={styles.impactName} numberOfLines={1}>
                  {f.name}
                  {f.starter ? ' (ilk 5)' : ''}
                </Text>
                <Text style={styles.meta}>
                  {f.minutes} dk · {f.points} sy · {f.plus_minus > 0 ? `+${f.plus_minus}` : f.plus_minus} +/-
                </Text>
              </View>
            ))}
            {pi.foul_commentary ? <Text style={styles.bodySmall}>{pi.foul_commentary}</Text> : null}
          </>
        ) : (
          <Text style={styles.meta}>Bu maçta 5 ve üzeri faul yapan oyuncu yok.</Text>
        )}
      </View>
      <Text style={styles.note}>{"Puanlar Hollinger Game Score'un hücum ve savunma bileşenleridir."}</Text>
    </Card>
  );
}

export function NbaAnalysisReport({ p, match }: { p: NbaTacticalPayload; match: Match }) {
  return (
    <View style={{ gap: space(3) }}>
      <VerdictCard p={p} />
      <EfficiencyCard p={p} match={match} />
      <QuarterRunsCard p={p} match={match} />
      <BenchImpactCard p={p} match={match} />
      <PlayerImpactCard p={p} match={match} />
    </View>
  );
}

const styles = StyleSheet.create({
  body: { color: colors.text, fontSize: 14, lineHeight: 21, opacity: 0.92 },
  bodySmall: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  meta: { color: colors.textMuted, fontSize: 12 },
  teamLabel: { fontSize: 12, fontWeight: '800' },
  grid: { flexDirection: 'row', gap: space(3) },
  vDivider: { width: 1, backgroundColor: colors.border },
  bigNumber: { color: colors.text, fontSize: 28, fontWeight: '900', fontVariant: ['tabular-nums'] },
  unit: { fontSize: 13, color: colors.textMuted, fontWeight: '700' },
  trap: { borderWidth: 1, borderColor: colors.danger, borderRadius: radius.md, padding: space(3), gap: 2, backgroundColor: 'rgba(255,77,94,0.08)' },
  trapTitle: { color: colors.danger, fontWeight: '800', fontSize: 13 },
  run: { gap: 4, paddingTop: space(2), borderTopWidth: 1, borderTopColor: colors.border },
  runHead: { flexDirection: 'row', alignItems: 'center', gap: space(2) },
  runQ: { fontWeight: '900', fontSize: 14 },
  sectionTitle: { color: colors.text, fontWeight: '800', fontSize: 14 },
  impactRow: { flexDirection: 'row', alignItems: 'center', gap: space(3) },
  rank: { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  rankText: { fontWeight: '900', fontSize: 12 },
  impactName: { color: colors.text, fontWeight: '800', fontSize: 14, flexShrink: 1 },
  impactScore: { color: colors.text, fontWeight: '900', fontSize: 18, fontVariant: ['tabular-nums'] },
  foulBox: { gap: space(2), paddingTop: space(3), borderTopWidth: 1, borderTopColor: colors.border },
  foulRow: { flexDirection: 'row', alignItems: 'center', gap: space(2), flexWrap: 'wrap' },
  note: { color: colors.textDim, fontSize: 11 },
  runTitle: { color: colors.text, fontWeight: '800', fontSize: 15 },
  swingTrack: { height: 6, backgroundColor: colors.surfaceAlt, borderRadius: radius.sm, overflow: 'hidden' },
  swingFill: { height: '100%', borderRadius: radius.sm },
  late: { gap: 2, paddingTop: space(2), borderTopWidth: 1, borderTopColor: colors.border },
  lateTitle: { color: colors.text, fontWeight: '800', fontSize: 13 },
  benchRow: { flexDirection: 'row', gap: space(2), alignItems: 'center', paddingVertical: space(2), borderTopWidth: 1, borderTopColor: colors.border },
  pmBox: { width: 58, height: 58, borderRadius: radius.md, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  pmValue: { fontSize: 17, fontWeight: '900', fontVariant: ['tabular-nums'] },
  pmLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '700' },
  spotlight: { borderWidth: 1, borderRadius: radius.md, padding: space(3), gap: space(2), backgroundColor: colors.surfaceAlt },
  spotHead: { flexDirection: 'row', alignItems: 'center', gap: space(3) },
  kickerPro: { color: colors.pro, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  headlineSmall: { color: colors.text, fontSize: 18, fontWeight: '900' },
  rating: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  ratingText: { color: colors.bg, fontWeight: '900', fontSize: 18, lineHeight: 20 },
  ratingLabel: { color: colors.bg, fontWeight: '800', fontSize: 8 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space(2) },
  statCell: { flexGrow: 1, flexBasis: '30%', backgroundColor: colors.surface, borderRadius: radius.sm, padding: space(2) },
  statValue: { color: colors.text, fontWeight: '900', fontSize: 16 },
  statLabel: { color: colors.textMuted, fontSize: 11 },
});
