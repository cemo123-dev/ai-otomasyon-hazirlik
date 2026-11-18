import { StyleSheet, Text, View } from 'react-native';
import { isFinished, isLive } from '@/lib/status';
import type { Match, MatchEvent } from '@/lib/types';
import { colors, space, type } from '@/theme';
import { Card, CardTitle } from '../ui';

const ICON: Record<MatchEvent['type'], string> = {
  goal: '⚽',
  penalty_goal: '⚽',
  own_goal: '⚽',
  red_card: '🟥',
  yellow_card: '🟨',
  substitution: '⇄',
  var: '▣',
};

const label = (e: MatchEvent) => {
  switch (e.type) {
    case 'goal':
      return e.detail ? `Asist: ${e.detail}` : 'Gol';
    case 'penalty_goal':
      return 'Penaltı golü';
    case 'own_goal':
      return 'Kendi kalesine';
    case 'substitution':
      return `Çıkan: ${e.detail ?? '—'}`;
    case 'red_card':
      return e.detail ?? 'Kırmızı kart';
    case 'var':
      return e.detail ?? 'VAR';
    default:
      return 'Sarı kart';
  }
};

/** Sekme 1: kırılma anları (gol, kırmızı kart, değişiklik) zaman çizelgesi */
export function Timeline({ match }: { match: Match }) {
  const events = [...(match.events ?? [])].sort((a, b) => a.minute - b.minute || (a.extra ?? 0) - (b.extra ?? 0));
  const keyMoments = events.filter((e) => e.type !== 'yellow_card');
  // Tasarım tur 2 R-1: başlamamış maçta "0 kritik olay" yerine açıklayıcı boş durum; "0 kritik olay" hiç yazılmaz
  const started = isLive(match.status_short) || isFinished(match.status_short);
  const title = !started
    ? 'Maç başlamadı'
    : keyMoments.length > 0
      ? `${keyMoments.length} kritik olay`
      : isFinished(match.status_short)
        ? 'Olay kaydı yok'
        : 'Henüz olay yok';

  return (
    <View style={{ gap: space(3) }}>
      {match.summary_teaser ? (
        <Card>
          <CardTitle kicker="MAÇ ÖZETİ" title="Kısa bakış" />
          <Text style={styles.teaser}>{match.summary_teaser}</Text>
        </Card>
      ) : null}

      <Card style={{ paddingHorizontal: 0 }}>
        <View style={{ paddingHorizontal: space(4) }}>
          <CardTitle kicker="KIRILMA ANLARI" title={title} />
        </View>
        {events.length === 0 ? (
          !started ? (
            <Text style={[styles.empty, { paddingHorizontal: space(4) }]}>
              Goller, kartlar ve değişiklikler maç başlayınca burada görünür.
            </Text>
          ) : null
        ) : (
          events.map((e, i) => {
            const home = e.team === 'home';
            const isGoal = e.type.includes('goal');
            return (
              <View key={i} style={[styles.row, isGoal && styles.goalRow]}>
                <View style={[styles.side, { alignItems: 'flex-end' }]}>
                  {home ? <EventText e={e} align="right" /> : null}
                </View>
                <View style={styles.center}>
                  <Text style={styles.icon}>{ICON[e.type]}</Text>
                  <Text style={styles.minute}>
                    {e.minute}
                    {e.extra ? `+${e.extra}'` : "'"}
                  </Text>
                </View>
                <View style={styles.side}>{!home ? <EventText e={e} align="left" /> : null}</View>
              </View>
            );
          })
        )}
      </Card>
    </View>
  );
}

function EventText({ e, align }: { e: MatchEvent; align: 'left' | 'right' }) {
  return (
    <>
      {/* Büyük yazıda bilgi (oyuncu adı) kırpılmasın: 2 satıra kadar (Döngü 5, bulgu 5) */}
      <Text style={[styles.player, { textAlign: align }]} numberOfLines={2}>
        {e.player}
      </Text>
      <Text style={[styles.detail, { textAlign: align }]} numberOfLines={2}>
        {label(e)}
      </Text>
    </>
  );
}

const styles = StyleSheet.create({
  teaser: { color: colors.text, fontSize: 14, lineHeight: 21 },
  empty: { ...type.bodySm, color: colors.textMuted },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: space(2), paddingHorizontal: space(4) },
  goalRow: { backgroundColor: colors.liveGlow },
  side: { flex: 1 },
  center: { width: 64, alignItems: 'center' },
  icon: { fontSize: 15, color: colors.text },
  minute: { color: colors.textMuted, fontSize: 11, fontWeight: '700', fontVariant: ['tabular-nums'] },
  player: { color: colors.text, fontSize: 14, fontWeight: '700' },
  detail: { color: colors.textMuted, fontSize: 12 },
});
