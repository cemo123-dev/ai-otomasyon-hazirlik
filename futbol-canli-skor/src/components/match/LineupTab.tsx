import { StyleSheet, Text, View } from 'react-native';
import {
  isFinished,
  type LineupPlayer,
  type Match,
  type PlayerRating,
  type TeamLineupDetail,
} from '@/lib/types';
import { colors, radius, space } from '@/theme';
import { Badge, Card, CardTitle } from '../ui';

type Side = 'home' | 'away';

const POS_ORDER = ['G', 'D', 'M', 'F'];
const POS_LABEL: Record<string, string> = { G: 'KL', D: 'DF', M: 'OS', F: 'FV' };
const POS_SPEECH: Record<string, string> = { G: 'kaleci', D: 'defans', M: 'orta saha', F: 'forvet' };

/**
 * Kadro kaynağı: tam kadro (matches.lineup_detail, 0013). Yoksa maç önü AI'nın yazdığı
 * matches.lineups (0005; numara/grid yok) yalnız ilk 11 için yedek olarak kullanılır.
 */
function lineupFor(m: Match, side: Side): TeamLineupDetail | null {
  const full = m.lineup_detail?.[side];
  if (Array.isArray(full?.start_xi) && full.start_xi.length) {
    return { ...full, substitutes: Array.isArray(full.substitutes) ? full.substitutes : [] };
  }
  const pre = m.lineups?.[side];
  if (!pre?.xi?.length) return null;
  return {
    team_id: null,
    formation: pre.formation ?? null,
    coach: pre.coach ?? null,
    start_xi: pre.xi.map((p) => ({ id: null, name: p.name, number: null, pos: p.pos ?? null, grid: null })),
    substitutes: [],
  };
}

const parseGrid = (g: string | null) => {
  const mm = g?.match(/^(\d{1,2}):(\d{1,2})$/);
  return mm ? { row: Number(mm[1]), col: Number(mm[2]) } : null;
};

/** İlk 11 → saha satırları (kaleci hattı ilk). grid yoksa pozisyona (G/D/M/F) göre gruplanır. */
export function pitchRows(xi: LineupPlayer[]): LineupPlayer[][] {
  if (xi.length && xi.every((p) => parseGrid(p.grid))) {
    const rows = new Map<number, LineupPlayer[]>();
    for (const p of xi) {
      const { row } = parseGrid(p.grid)!;
      rows.set(row, [...(rows.get(row) ?? []), p]);
    }
    return [...rows.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([, ps]) => ps.sort((a, b) => parseGrid(a.grid)!.col - parseGrid(b.grid)!.col));
  }
  const byPos = POS_ORDER.map((pos) => xi.filter((p) => (POS_ORDER.includes(p.pos ?? '') ? p.pos : 'M') === pos));
  return byPos.filter((r) => r.length);
}

/** "M. Icardi" → "Icardi" (sahada kısa ad) */
const shortName = (name: string) => {
  const parts = String(name ?? '').trim().split(/\s+/);
  return parts[parts.length - 1] || '—';
};

// Orta aralık gri (textMuted; onFill ile 6.51:1): turuncu rozet deplasman formasıyla kaynaşıyordu (tasarım B-4)
const ratingColor = (r: number) => (r >= 7.5 ? colors.live : r >= 6.5 ? colors.textMuted : colors.danger);

function ratingOf(ratings: PlayerRating[] | null, side: Side, p: LineupPlayer): number | null {
  if (!ratings) return null;
  const hit = ratings.find((r) => r.team === side && (p.id != null ? r.id === p.id : r.name === p.name));
  return hit ? hit.rating : null;
}

/** Ekran okuyucu: "Demir, 1 numara, puan 6.3" (Döngü 5, bulgu 6); rozet rengi sayıyla aynı bilgiyi verir */
function markerLabel(p: LineupPlayer, rating: number | null): string {
  const parts = [String(p.name ?? '—')];
  if (p.number != null) parts.push(`${p.number} numara`);
  else if (p.pos && POS_SPEECH[p.pos]) parts.push(POS_SPEECH[p.pos]);
  if (rating != null) parts.push(`puan ${rating.toFixed(1)}`);
  return parts.join(', ');
}

function Marker({ p, side, rating }: { p: LineupPlayer; side: Side; rating: number | null }) {
  return (
    // Tek öğe olarak okunsun: aksi hâlde "1", "6.3", "Demir" ayrı ayrı okunur
    <View style={styles.marker} accessible accessibilityLabel={markerLabel(p, rating)}>
      <View style={[styles.shirt, { backgroundColor: side === 'home' ? colors.home : colors.away }]}>
        <Text style={styles.shirtText} maxFontSizeMultiplier={1.2}>
          {p.number ?? POS_LABEL[p.pos ?? ''] ?? '•'}
        </Text>
        {rating != null ? (
          <View style={[styles.ratingDot, { backgroundColor: ratingColor(rating) }]}>
            <Text style={styles.ratingDotText} maxFontSizeMultiplier={1.2}>
              {rating.toFixed(1)}
            </Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.markerName} numberOfLines={1} maxFontSizeMultiplier={1.2}>
        {shortName(p.name)}
      </Text>
    </View>
  );
}

/** Bir takımın yarı sahası. Ev sahibi üstte (kaleci en üstte), deplasman altta (kaleci en altta). */
function Half({ team, side, ratings }: { team: TeamLineupDetail | null; side: Side; ratings: PlayerRating[] | null }) {
  if (!team) {
    return (
      <View style={[styles.half, styles.halfEmpty]}>
        <Text style={styles.muted}>Kadro henüz yok</Text>
      </View>
    );
  }
  let rows = pitchRows(team.start_xi);
  // Ev sahibi aşağı doğru hücum eder: soldan sağa sıra aynalanır (izleyici bakışı)
  if (side === 'home') rows = rows.map((r) => [...r].reverse());
  else rows = [...rows].reverse();
  return (
    <View style={styles.half}>
      {rows.map((r, i) => (
        <View key={i} style={styles.pitchRow}>
          {r.map((p, j) => (
            <Marker key={`${p.id ?? p.name}-${j}`} p={p} side={side} rating={ratingOf(ratings, side, p)} />
          ))}
        </View>
      ))}
    </View>
  );
}

function Bench({ m, side, team }: { m: Match; side: Side; team: TeamLineupDetail | null }) {
  const name = side === 'home' ? m.home_team : m.away_team;
  return (
    <Card>
      <CardTitle kicker={team?.formation ? `DİZİLİŞ ${team.formation}` : 'KADRO'} title={name} />
      <Text style={styles.coach}>
        Teknik direktör: <Text style={styles.coachName}>{team?.coach ?? '—'}</Text>
      </Text>
      {team?.substitutes.length ? (
        <View style={{ gap: space(1.5) }}>
          <Text style={styles.subTitle}>YEDEKLER</Text>
          {team.substitutes.map((p, i) => (
            <View key={`${p.id ?? p.name}-${i}`} style={styles.subRow}>
              <Text style={styles.subNo}>{p.number ?? '–'}</Text>
              <Text style={styles.subName} numberOfLines={1}>
                {p.name}
              </Text>
              <Text style={styles.subPos}>{POS_LABEL[p.pos ?? ''] ?? ''}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.muted}>Yedek listesi henüz yok.</Text>
      )}
    </Card>
  );
}

function Ratings({ m, ratings }: { m: Match; ratings: PlayerRating[] }) {
  const [best, ...rest] = ratings;
  const team = (s: Side) => (s === 'home' ? m.home_team : m.away_team);
  return (
    <Card accent={colors.pro}>
      <CardTitle kicker="MAÇ SONU" title="Oyuncu Puanları" />
      <View style={styles.motm}>
        <Badge label="★ MAÇIN OYUNCUSU" color={colors.pro} />
        <View style={styles.rateRow}>
          <Text style={[styles.rateName, { fontWeight: '900' }]} numberOfLines={1}>
            {best.name}
          </Text>
          <Text style={[styles.rateValue, { color: ratingColor(best.rating) }]}>{best.rating.toFixed(1)}</Text>
        </View>
        <Text style={styles.rateMeta}>
          {team(best.team)} · {best.minutes} dk{best.goals ? ` · ${best.goals} gol` : ''}
          {best.assists ? ` · ${best.assists} asist` : ''}
        </Text>
      </View>
      {rest.map((r, i) => (
        <View key={`${r.id ?? r.name}-${i}`} style={styles.rateRow}>
          <View style={[styles.teamDot, { backgroundColor: r.team === 'home' ? colors.home : colors.away }]} />
          <Text style={styles.rateName} numberOfLines={1}>
            {r.name}
          </Text>
          <Text style={styles.rateMin}>{r.minutes}&apos;</Text>
          <Text style={[styles.rateValue, { color: ratingColor(r.rating) }]}>{r.rating.toFixed(1)}</Text>
        </View>
      ))}
    </Card>
  );
}

/** Futbol "Kadro" sekmesi: saha dizilişi, yedekler, teknik direktör; maç bitince oyuncu puanları */
export function LineupTab({ match: m }: { match: Match }) {
  const home = lineupFor(m, 'home');
  const away = lineupFor(m, 'away');
  const done = isFinished(m.status_short);
  // Puanlar yalnız maç bitince (canlıda eksik/oynak); 0 dk ve puansız oyuncu zaten sunucuda elenir
  const raw = Array.isArray(m.player_ratings) ? m.player_ratings : [];
  const ratings = done
    ? raw.filter((r) => typeof r?.rating === 'number' && Number.isFinite(r.rating) && r.rating > 0 && r.minutes > 0 && !!r.name)
    : [];
  const ratingList = ratings.length ? [...ratings].sort((a, b) => b.rating - a.rating) : null;

  if (!home && !away) {
    return (
      <View style={{ gap: space(3) }}>
        <Card>
          <CardTitle kicker="KADRO" title={done ? 'Bu maç için kadro verisi yok' : 'Kadrolar henüz açıklanmadı'} />
          <Text style={styles.muted}>
            Kadrolar maçtan ~20-40 dk önce açıklanır. Ücretsiz veri planında tam kadro ve oyuncu puanları maç bitince
            eklenir.
          </Text>
        </Card>
        {ratingList ? <Ratings m={m} ratings={ratingList} /> : null}
      </View>
    );
  }

  return (
    <View style={{ gap: space(3) }}>
      <View style={styles.pitch} accessibilityLabel="Saha dizilişi">
        <Text style={styles.pitchLabel}>
          {m.home_team}
          {home?.formation ? ` · ${home.formation}` : ''}
        </Text>
        <Half team={home} side="home" ratings={ratingList} />
        <View style={styles.midLine}>
          <View style={styles.midCircle} />
        </View>
        <Half team={away} side="away" ratings={ratingList} />
        <Text style={styles.pitchLabel}>
          {m.away_team}
          {away?.formation ? ` · ${away.formation}` : ''}
        </Text>
      </View>
      {done && ratingList ? <Ratings m={m} ratings={ratingList} /> : null}
      {done && !ratingList ? (
        <Card>
          <Text style={styles.muted}>Oyuncu puanları henüz yok; maç verisi tamamlanınca eklenir.</Text>
        </Card>
      ) : null}
      <Bench m={m} side="home" team={home} />
      <Bench m={m} side="away" team={away} />
    </View>
  );
}

/** Orta saha dairesinin yarıçapı (px) */
const MID_R = 24;

const styles = StyleSheet.create({
  muted: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  pitch: {
    backgroundColor: '#0F2A1C',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#1F4A33',
    paddingVertical: space(2),
    paddingHorizontal: space(1),
    overflow: 'hidden',
  },
  pitchLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '800', textAlign: 'center', paddingVertical: space(1) },
  half: { minHeight: 220, justifyContent: 'space-around', paddingVertical: space(1), gap: space(2) },
  halfEmpty: { alignItems: 'center', justifyContent: 'center' },
  pitchRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-start' },
  // Santrfor adı orta saha dairesinin çizgisine binmesin (tasarım B-8): dikey boşluk dairenin yarıçapından
  // büyük olmalı (space(3) = 12 px, 28 px'lik yarıçapa yetmiyordu). Daire 48 px, boşluk yarıçap + 4.
  midLine: { height: 1, backgroundColor: '#2C6145', marginVertical: MID_R + space(1), alignItems: 'center', justifyContent: 'center' },
  midCircle: { width: MID_R * 2, height: MID_R * 2, borderRadius: MID_R, borderWidth: 1, borderColor: '#2C6145', position: 'absolute' },
  // Üst boşluk: puan rozeti üst satırdaki ismin üstüne binmesin
  marker: { alignItems: 'center', width: 62, paddingTop: space(2) },
  shirt: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  // Koyu numara: beyaz, turuncu/mavi üstünde AA geçmiyordu
  shirtText: { color: colors.onFill, fontSize: 12, fontWeight: '900', fontVariant: ['tabular-nums'] },
  ratingDot: { position: 'absolute', top: -6, right: -16, borderRadius: 6, paddingHorizontal: 3, paddingVertical: 1 },
  ratingDotText: { color: colors.onFill, fontSize: 10, fontWeight: '900', fontVariant: ['tabular-nums'] },
  markerName: { color: colors.text, fontSize: 10, fontWeight: '700', marginTop: 3, maxWidth: 62, textAlign: 'center' },
  coach: { color: colors.textMuted, fontSize: 13 },
  coachName: { color: colors.text, fontWeight: '700' },
  subTitle: { color: colors.textMuted, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: space(2) },
  subNo: { width: 24, color: colors.textMuted, fontSize: 13, fontWeight: '700', textAlign: 'right', fontVariant: ['tabular-nums'] },
  subName: { flex: 1, color: colors.text, fontSize: 14 },
  subPos: { color: colors.textDim, fontSize: 11, fontWeight: '700' },
  motm: { gap: space(1), paddingBottom: space(2), borderBottomWidth: 1, borderBottomColor: colors.border },
  rateRow: { flexDirection: 'row', alignItems: 'center', gap: space(2) },
  teamDot: { width: 6, height: 6, borderRadius: 3 },
  rateName: { flex: 1, color: colors.text, fontSize: 14 },
  rateMin: { color: colors.textDim, fontSize: 12, fontVariant: ['tabular-nums'] },
  rateValue: { width: 34, textAlign: 'right', fontSize: 14, fontWeight: '900', fontVariant: ['tabular-nums'] },
  rateMeta: { color: colors.textMuted, fontSize: 12 },
});
