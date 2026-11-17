import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { usePremium } from '@/hooks/usePremium';
import { dataSource } from '@/lib/data';
import type { Match, MatchAlert, RedCardAnalysis } from '@/lib/types';
import { colors, radius, space } from '@/theme';
import { Card, CardTitle } from '../ui';

const KIND_COLOR: Record<MatchAlert['kind'], string> = {
  pressure: colors.danger,
  nba_run: colors.warning,
  red_card: colors.pro,
};

const timeLabel = (m: Match, a: MatchAlert) =>
  a.minute == null ? '' : m.sport_type === 'nba' ? (a.minute <= 4 ? `Ç${a.minute}` : 'UZ') : `${a.minute}'`;

/** Maç ekranı: akıllı alarm geçmişi (metin herkese açık, kırmızı kart analizi Pro) */
export function AlertsFeed({ match, alerts }: { match: Match; alerts: MatchAlert[] }) {
  if (!alerts.length) return null;
  return (
    <Card>
      <CardTitle kicker="Akıllı Alarm" title="Maçın kritik anları" />
      {alerts.map((a) => (
        <AlertRow key={a.id} match={match} a={a} />
      ))}
    </Card>
  );
}

function AlertRow({ match, a }: { match: Match; a: MatchAlert }) {
  const { isPremium } = usePremium();
  const [open, setOpen] = useState(false);
  const [analysis, setAnalysis] = useState<RedCardAnalysis | null | 'loading'>(null);
  const hasAnalysis = a.kind === 'red_card' && a.analysis_status === 'completed';

  const toggle = async () => {
    if (!hasAnalysis) return;
    if (!isPremium) return router.push('/paywall');
    const next = !open;
    setOpen(next);
    if (next && analysis == null) {
      setAnalysis('loading');
      setAnalysis(await dataSource.getAlertAnalysis(a.id).catch(() => null));
    }
  };

  return (
    <View style={[styles.row, { borderLeftColor: KIND_COLOR[a.kind] }]}>
      <View style={styles.head}>
        <Text style={[styles.title, { color: KIND_COLOR[a.kind] }]}>{a.title}</Text>
        <Text style={styles.time}>{timeLabel(match, a)}</Text>
      </View>
      <Text style={styles.body}>{a.body}</Text>

      {a.kind === 'red_card' && a.analysis_status === 'generating' ? (
        <Text style={styles.meta}>Canlı taktik analiz hazırlanıyor…</Text>
      ) : null}
      {hasAnalysis ? (
        <Pressable accessibilityRole="button" onPress={toggle} style={({ pressed }) => [styles.link, pressed && { opacity: 0.8 }]}>
          <Text style={styles.linkText}>
            {isPremium ? (open ? 'Analizi gizle' : '✦ Canlı taktik analizi gör') : '🔒 Canlı taktik analiz Pro üyelere özel'}
          </Text>
        </Pressable>
      ) : null}

      {open && analysis === 'loading' ? <ActivityIndicator color={colors.pro} style={{ marginTop: space(2) }} /> : null}
      {open && analysis && analysis !== 'loading' ? <RedCardReport p={analysis} match={match} /> : null}
    </View>
  );
}

function RedCardReport({ p, match }: { p: RedCardAnalysis; match: Match }) {
  const name = (s: 'home' | 'away') => (s === 'home' ? match.home_team : match.away_team);
  return (
    <View style={styles.report}>
      <Text style={styles.headline}>{p.headline}</Text>
      <Text style={styles.body}>{p.situation}</Text>
      {p.prescriptions.map((r, i) => (
        <View key={i} style={[styles.rx, { borderLeftColor: r.side === 'home' ? colors.home : colors.away }]}>
          <Text style={[styles.team, { color: r.side === 'home' ? colors.home : colors.away }]}>{name(r.side)}</Text>
          <Text style={styles.move}>{r.move}</Text>
          {r.why ? <Text style={styles.meta}>{r.why}</Text> : null}
        </View>
      ))}
      {p.key ? <Text style={styles.key}>🔑 {p.key}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { borderLeftWidth: 3, paddingLeft: space(3), paddingVertical: space(2), gap: 3 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 13, fontWeight: '900' },
  time: { color: colors.textMuted, fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] },
  body: { color: colors.text, fontSize: 14, lineHeight: 20 },
  meta: { color: colors.textMuted, fontSize: 12, lineHeight: 17 },
  link: { alignSelf: 'flex-start', marginTop: space(1.5), backgroundColor: colors.proGlow, borderRadius: radius.sm, paddingHorizontal: space(3), paddingVertical: space(1.5) },
  linkText: { color: colors.pro, fontWeight: '800', fontSize: 12 },
  report: { marginTop: space(2), gap: space(2), backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: space(3) },
  headline: { color: colors.text, fontSize: 16, fontWeight: '900' },
  rx: { borderLeftWidth: 3, paddingLeft: space(2.5), gap: 2 },
  team: { fontSize: 11, fontWeight: '900' },
  move: { color: colors.text, fontWeight: '800', fontSize: 14, lineHeight: 19 },
  key: { color: colors.text, fontWeight: '700', fontSize: 13, lineHeight: 19 },
});
