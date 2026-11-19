import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { HalftimePayload, Match } from '@/lib/types';
import { colors, radius, space } from '@/theme';
import { AiFooter } from '../ai/ReportAi';
import { CompareBar } from '../match/StatsBars';
import { Badge, Card, CardTitle } from '../ui';

const sideColor = (s: 'home' | 'away') => (s === 'home' ? colors.home : colors.away);

/** Pro: "İkinci Yarıda Ne Olmalı?" raporu */
export function HalftimeReport({ p, match }: { p: HalftimePayload; match: Match }) {
  const h = p.first_half?.home;
  const a = p.first_half?.away;
  const teamName = (s: 'home' | 'away') => (s === 'home' ? match.home_team : match.away_team);
  return (
    <View style={{ gap: space(3) }}>
      <Card accent={colors.pro}>
        <Badge label="✦ AI · SOYUNMA ODASI REÇETESİ" color={colors.pro} />
        <Text style={styles.headline}>{p.headline}</Text>
        <Text style={styles.body}>{p.situation}</Text>
      </Card>

      <Card>
        <CardTitle kickerColor={colors.pro} kicker="İKİNCİ YARIDA NE OLMALI?" title="Hamleler" />
        {p.prescriptions.length ? (
          p.prescriptions.map((r, i) => (
            <View key={i} style={[styles.rx, { borderLeftColor: sideColor(r.side) }]}>
              <Text style={[styles.team, { color: sideColor(r.side) }]}>{teamName(r.side)}</Text>
              <Text style={styles.move}>{r.move}</Text>
              {r.why ? <Text style={styles.why}>{r.why}</Text> : null}
            </View>
          ))
        ) : (
          <Text style={styles.why}>Bu maç için güvenilir hamle önerisi üretilemedi; ilk yarı verisine aşağıdan bakabilirsin.</Text>
        )}
        {p.key ? (
          <View style={styles.key}>
            <Text style={styles.keyText}>🔑 {p.key}</Text>
          </View>
        ) : null}
      </Card>

      {h && a ? (
        <Card>
          <CardTitle
            kickerColor={colors.pro}
            kicker="İLK YARI"
            title={`${p.score.home}-${p.score.away}`}
            right={p.formations.home && p.formations.away ? <Text style={styles.meta}>{p.formations.home} · {p.formations.away}</Text> : undefined}
          />
          {h.possession != null && a.possession != null ? <CompareBar label="Topla oynama" home={h.possession} away={a.possession} fmt={(v) => `%${v}`} /> : null}
          {h.xg != null && a.xg != null ? <CompareBar label="xG" home={h.xg} away={a.xg} fmt={(v) => v.toFixed(2)} /> : null}
          <CompareBar label="Şut" home={h.shots} away={a.shots} />
          <CompareBar label="İsabetli şut" home={h.on_target} away={a.on_target} />
          <CompareBar label="Ceza sahası dışı şut" home={h.outside_box} away={a.outside_box} />
        </Card>
      ) : null}

      <Text style={styles.note}>
        Rapor devre arasında ilk yarı verisiyle bir kez üretilir; sayılar maç verisiyle doğrulanır.
      </Text>
      {/* F7: etiket + "Hata bildir" */}
      <AiFooter fixtureId={match.fixture_id} surface="halftime" center />
    </View>
  );
}

/** Ücretsiz: tek cümlelik teaser + Pro çağrısı */
export function HalftimeLocked({ match }: { match: Match }) {
  return (
    <Card accent={colors.pro}>
      <Text style={styles.lock}>🔒</Text>
      <Text style={styles.cardTitle}>Devre arası AI raporu Pro üyelere özel</Text>
      {match.halftime_teaser ? <Text style={styles.body}>{match.halftime_teaser}</Text> : null}
      <Text style={styles.why}>İlk yarının özeti ve iki takım için ikinci yarı hamleleri.</Text>
      <Pressable accessibilityRole="button" onPress={() => router.push('/paywall')} style={({ pressed }) => [styles.button, pressed && { opacity: 0.85 }]}>
        <Text style={styles.buttonText}>{"Pro'ya Geçerek Raporu Aç"}</Text>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  headline: { color: colors.text, fontSize: 21, fontWeight: '900', lineHeight: 27 },
  body: { color: colors.text, fontSize: 14, lineHeight: 21 },
  cardTitle: { color: colors.text, fontWeight: '900', fontSize: 16 },
  rx: { borderLeftWidth: 3, paddingLeft: space(3), paddingVertical: space(1.5), gap: 2 },
  team: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  move: { color: colors.text, fontWeight: '800', fontSize: 15, lineHeight: 20 },
  why: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  key: { marginTop: space(1), backgroundColor: colors.proGlow, borderRadius: radius.md, padding: space(3) },
  keyText: { color: colors.text, fontWeight: '700', fontSize: 14, lineHeight: 20 },
  meta: { color: colors.textMuted, fontSize: 12 },
  note: { color: colors.textDim, fontSize: 11, lineHeight: 15, textAlign: 'center' },
  lock: { fontSize: 26 },
  button: { marginTop: space(2), minHeight: 48, justifyContent: 'center', backgroundColor: colors.pro, borderRadius: radius.md, paddingVertical: space(3), paddingHorizontal: space(4) },
  buttonText: { color: colors.onFill, fontWeight: '900', fontSize: 15, textAlign: 'center' },
});
