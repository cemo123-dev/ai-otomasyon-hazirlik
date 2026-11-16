import { StyleSheet, Text, View } from 'react-native';
import type { Match, ShotQualityVerdict, TacticalPayload, TeamShotAudit } from '@/lib/types';
import { colors, radius, space } from '@/theme';
import { CompareBar } from '../match/StatsBars';
import { Badge, Card, CardTitle } from '../ui';

const teamColor = (t: 'home' | 'away' | 'neutral') =>
  t === 'home' ? colors.home : t === 'away' ? colors.away : colors.textMuted;

const VERDICT_COLOR: Record<ShotQualityVerdict, string> = {
  sterile_dominance: colors.warning,
  clinical_transition: colors.live,
  balanced_exchange: colors.accent,
  chance_wastage: colors.danger,
};

/** Kart 1: Ana Taktik Hüküm */
export function VerdictCard({ p }: { p: TacticalPayload }) {
  return (
    <Card accent={colors.pro} style={{ backgroundColor: colors.surfaceAlt }}>
      <Badge label="✦ PRO TAKTİK HÜKÜM" color={colors.pro} />
      <Text style={styles.headline}>{p.headline_title}</Text>
      <Text style={styles.body}>{p.executive_tactical_verdict}</Text>
    </Card>
  );
}

/** Kart 2: xG & Şut Kalitesi Denetimi */
export function XgAuditCard({ p, match }: { p: TacticalPayload; match: Match }) {
  const a = p.xg_and_shot_quality_audit;
  const vc = VERDICT_COLOR[a.verdict_type];
  return (
    <Card>
      <CardTitle kicker="xG & Şut Kalitesi Denetimi" title={a.verdict_label} right={<Badge label={a.verdict_type.split('_').join(' ').toUpperCase()} color={vc} />} />
      <View style={styles.auditGrid}>
        <AuditColumn team={match.home_team} color={colors.home} s={a.home} />
        <View style={styles.vDivider} />
        <AuditColumn team={match.away_team} color={colors.away} s={a.away} />
      </View>
      <CompareBar label="Şut başına xG" home={a.home.xg_per_shot} away={a.away.xg_per_shot} fmt={(v) => v.toFixed(2)} />
      <CompareBar label="İsabetli şut" home={a.home.shots_on_target} away={a.away.shots_on_target} />
      <Text style={styles.body}>{a.commentary}</Text>
    </Card>
  );
}

function AuditColumn({ team, color, s }: { team: string; color: string; s: TeamShotAudit }) {
  return (
    <View style={{ flex: 1, gap: 6 }}>
      <Text style={[styles.teamLabel, { color }]} numberOfLines={1}>{team}</Text>
      <Text style={styles.bigNumber}>{s.xg.toFixed(2)}<Text style={styles.unit}> xG</Text></Text>
      <Text style={styles.meta}>{s.shots} şut · {s.shots_inside_box} ceza sahası içinden</Text>
    </View>
  );
}

/** Kart 3: Oyun Durumu & Momentum Kırılmaları (kronolojik) */
export function MomentumCard({ p }: { p: TacticalPayload }) {
  const shifts = [...p.game_state_and_momentum_shifts].sort((a, b) => a.minute - b.minute);
  return (
    <Card>
      <CardTitle kicker="Oyun Durumu & Momentum" title="Kırılma anları" />
      <View>
        {shifts.map((s, i) => {
          const c = teamColor(s.momentum);
          const last = i === shifts.length - 1;
          return (
            <View key={i} style={styles.shift}>
              <View style={styles.rail}>
                <View style={[styles.node, { backgroundColor: c }]} />
                {!last ? <View style={styles.line} /> : null}
              </View>
              <View style={{ flex: 1, paddingBottom: last ? 0 : space(4), gap: 4 }}>
                <View style={styles.shiftHead}>
                  <Text style={[styles.shiftMinute, { color: c }]}>{s.minute}'</Text>
                  {s.score_state ? <Badge label={s.score_state} color={colors.textMuted} /> : null}
                </View>
                <Text style={styles.shiftTitle}>{s.title}</Text>
                <Text style={styles.bodySmall}>{s.description}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

/** Kart 4: Teknik Direktör & Kulübe Etki Deltası + Maçın Yıldızı */
export function ManagerAndSpotlightCard({ p, match }: { p: TacticalPayload; match: Match }) {
  const m = p.managerial_and_bench_impact;
  const sp = p.player_performance_spotlight;
  const spColor = sp.team === 'home' ? colors.home : colors.away;
  return (
    <Card>
      <CardTitle kicker="Teknik Direktör & Kulübe" title="Etki deltası" />
      {(['home', 'away'] as const).map((side) => {
        const x = m[side];
        const positive = x.delta > 0;
        const deltaColor = x.delta === 0 ? colors.textMuted : positive ? colors.live : colors.danger;
        return (
          <View key={side} style={styles.mgr}>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={[styles.teamLabel, { color: teamColor(side) }]}>
                {side === 'home' ? match.home_team : match.away_team}
              </Text>
              <Text style={styles.shiftTitle}>{x.manager}</Text>
              <Text style={styles.meta}>Kilit hamle: {x.key_decision}</Text>
              <Text style={styles.bodySmall}>{x.commentary}</Text>
            </View>
            <View style={[styles.delta, { borderColor: deltaColor }]}>
              <Text style={[styles.deltaValue, { color: deltaColor }]}>
                {positive ? '+' : ''}
                {x.delta.toFixed(1)}
              </Text>
              <Text style={styles.deltaLabel}>Δ etki</Text>
            </View>
          </View>
        );
      })}

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
            <Text style={styles.ratingText}>{sp.rating.toFixed(1)}</Text>
          </View>
        </View>
        <Text style={styles.bodySmall}>{sp.headline}</Text>
        <View style={styles.statGrid}>
          {sp.key_stats.map((k) => (
            <View key={k.label} style={styles.statCell}>
              <Text style={styles.statValue}>{k.value}</Text>
              <Text style={styles.statLabel}>{k.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </Card>
  );
}

export function AnalysisReport({ p, match }: { p: TacticalPayload; match: Match }) {
  return (
    <View style={{ gap: space(3) }}>
      <VerdictCard p={p} />
      <XgAuditCard p={p} match={match} />
      <MomentumCard p={p} />
      <ManagerAndSpotlightCard p={p} match={match} />
    </View>
  );
}

const styles = StyleSheet.create({
  headline: { color: colors.text, fontSize: 21, fontWeight: '900', lineHeight: 27 },
  headlineSmall: { color: colors.text, fontSize: 18, fontWeight: '900' },
  body: { color: colors.text, fontSize: 14, lineHeight: 21, opacity: 0.92 },
  bodySmall: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  meta: { color: colors.textMuted, fontSize: 12 },
  teamLabel: { fontSize: 12, fontWeight: '800' },
  auditGrid: { flexDirection: 'row', gap: space(3) },
  vDivider: { width: 1, backgroundColor: colors.border },
  bigNumber: { color: colors.text, fontSize: 28, fontWeight: '900', fontVariant: ['tabular-nums'] },
  unit: { fontSize: 13, color: colors.textMuted, fontWeight: '700' },
  shift: { flexDirection: 'row', gap: space(3) },
  rail: { width: 14, alignItems: 'center' },
  node: { width: 12, height: 12, borderRadius: 6, marginTop: 3 },
  line: { flex: 1, width: 2, backgroundColor: colors.border, marginTop: 2 },
  shiftHead: { flexDirection: 'row', alignItems: 'center', gap: space(2) },
  shiftMinute: { fontWeight: '900', fontSize: 14, fontVariant: ['tabular-nums'] },
  shiftTitle: { color: colors.text, fontWeight: '800', fontSize: 15 },
  mgr: { flexDirection: 'row', gap: space(3), paddingVertical: space(2), borderTopWidth: 1, borderTopColor: colors.border },
  delta: { width: 64, height: 64, borderRadius: radius.md, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  deltaValue: { fontSize: 20, fontWeight: '900', fontVariant: ['tabular-nums'] },
  deltaLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '700' },
  spotlight: { borderWidth: 1, borderRadius: radius.md, padding: space(3), gap: space(2), backgroundColor: colors.surfaceAlt },
  spotHead: { flexDirection: 'row', alignItems: 'center', gap: space(3) },
  kickerPro: { color: colors.pro, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  rating: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  ratingText: { color: colors.bg, fontWeight: '900', fontSize: 18 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space(2) },
  statCell: { flexGrow: 1, flexBasis: '45%', backgroundColor: colors.surface, borderRadius: radius.sm, padding: space(2) },
  statValue: { color: colors.text, fontWeight: '900', fontSize: 16 },
  statLabel: { color: colors.textMuted, fontSize: 11 },
});
