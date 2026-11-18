import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { isLive, type Match, type NbaBoxLine } from '@/lib/types';
import { colors, space } from '@/theme';
import { TeamLogo } from '../TeamLogo';
import { Card } from '../ui';

/** Satır verisi: oyuncu veya takım toplamı (yüzdeler toplamdan hesaplanır) */
type Line = Pick<
  NbaBoxLine,
  'minutes' | 'points' | 'rebounds' | 'assists' | 'plus_minus' | 'fgm' | 'fga' | 'tpm' | 'tpa' | 'fta'
> &
  Partial<Pick<NbaBoxLine, 'ftm' | 'off_reb' | 'def_reb' | 'steals' | 'blocks' | 'turnovers' | 'fouls'>>;

type Col = { label: string; get: (p: Line) => string; width: number; strong?: boolean };

const n = (v?: number) => String(v ?? 0);
/** İsabet yüzdesi, 1 ondalık (deneme yoksa 0.0) */
const pct = (m?: number, a?: number) => (a ? ((100 * (m ?? 0)) / a).toFixed(1) : '0.0');
const sgn = (v: number) => (v > 0 ? `+${v}` : String(v));

// NBA kutu skoru sütunları: önce sayı / ribaund / asist (360 pt'de kaydırmadan görünür), sonra yüzdeler ve ayrıntı
const COLS: Col[] = [
  { label: 'DK', get: (p) => n(p.minutes), width: 34 },
  { label: 'PTS', get: (p) => n(p.points), width: 38, strong: true },
  { label: 'REB', get: (p) => n(p.rebounds), width: 38 },
  { label: 'AST', get: (p) => n(p.assists), width: 38 },
  { label: 'FG%', get: (p) => pct(p.fgm, p.fga), width: 44 },
  { label: '3P%', get: (p) => pct(p.tpm, p.tpa), width: 44 },
  { label: 'FT%', get: (p) => pct(p.ftm, p.fta), width: 44 },
  { label: 'FGM', get: (p) => n(p.fgm), width: 38 },
  { label: 'FGA', get: (p) => n(p.fga), width: 38 },
  { label: '3PM', get: (p) => n(p.tpm), width: 38 },
  { label: '3PA', get: (p) => n(p.tpa), width: 38 },
  { label: 'FTM', get: (p) => n(p.ftm), width: 38 },
  { label: 'FTA', get: (p) => n(p.fta), width: 38 },
  { label: 'OREB', get: (p) => n(p.off_reb), width: 42 },
  { label: 'DREB', get: (p) => n(p.def_reb), width: 42 },
  { label: 'STL', get: (p) => n(p.steals), width: 36 },
  { label: 'BLK', get: (p) => n(p.blocks), width: 36 },
  { label: 'TO', get: (p) => n(p.turnovers), width: 32 },
  { label: 'PF', get: (p) => n(p.fouls), width: 32 },
  { label: '+/-', get: (p) => sgn(p.plus_minus), width: 40 },
];

const NAME_W = 140;

const sum = (rows: NbaBoxLine[], k: keyof NbaBoxLine) => rows.reduce((t, r) => t + (Number(r[k]) || 0), 0);

/** "Guard-Forward" → "G-F", "Pivot" → "C" (eski kayıtlarda "Forvet") */
const posLetter = (pos?: string) =>
  (pos ?? '')
    .split('-')
    .map((x) => (/^g/i.test(x) ? 'G' : /^f/i.test(x) ? 'F' : /^(p|c)/i.test(x) ? 'C' : ''))
    .filter(Boolean)
    .join('-');

/** NBA "Box Score" sekmesi: iki takımın tam kutu skoru alt alta (yatay kaydırmalı tablo) */
export function BoxScoreTab({ match }: { match: Match }) {
  const box = Array.isArray(match.box_score) ? match.box_score : [];
  // [] = sunucu denedi ama oyuncu verisi gelmedi (null = henüz denenmedi)
  const checkedEmpty = Array.isArray(match.box_score) && !match.box_score.length;

  if (!box.length) {
    return (
      <Card>
        <Text style={styles.empty}>
          {isLive(match.status_short)
            ? 'Box score maç bitince yüklenir. Canlı skor ve çeyrekler Özet sekmesinde.'
            : match.status_short === 'FT'
              ? checkedEmpty
                ? 'Bu maç için oyuncu istatistiği yayınlanmadı; box score yok. Takım istatistikleri ve çeyrekler Özet sekmesinde.'
                : 'Box score hazırlanıyor; maçtan kısa süre sonra burada olacak.'
              : 'Box score maç bittiğinde görünecek.'}
        </Text>
      </Card>
    );
  }

  return (
    <View style={{ gap: space(3) }}>
      <TeamBox match={match} side="home" rows={box.filter((p) => p && p.team === 'home')} />
      <TeamBox match={match} side="away" rows={box.filter((p) => p && p.team === 'away')} />
      <Text style={styles.legend}>
        DK dakika · PTS sayı · FG%/3P%/FT% isabet yüzdeleri · FGM/FGA saha içi isabet/deneme · 3PM/3PA üçlük · FTM/FTA serbest atış · OREB/DREB hücum/savunma ribaundu ·
        REB ribaund · AST asist · STL top çalma · BLK blok · TO top kaybı · PF faul · ★ takımın en skoreri · G guard · F forward · C pivot
      </Text>
    </View>
  );
}

function TeamBox({ match, side, rows }: { match: Match; side: 'home' | 'away'; rows: NbaBoxLine[] }) {
  if (!rows.length) return null;
  const team = side === 'home' ? match.home_team : match.away_team;
  // İlk 5 üstte, sonra yedekler (sunucu sırasını korur)
  const ordered = [...rows.filter((p) => p.starter), ...rows.filter((p) => !p.starter)];
  const total: Line = {
    minutes: sum(rows, 'minutes'),
    points: sum(rows, 'points'),
    rebounds: sum(rows, 'rebounds'),
    assists: sum(rows, 'assists'),
    // Takım +/- = skor farkı
    plus_minus: (side === 'home' ? 1 : -1) * ((match.home_score ?? 0) - (match.away_score ?? 0)),
    fgm: sum(rows, 'fgm'),
    fga: sum(rows, 'fga'),
    tpm: sum(rows, 'tpm'),
    tpa: sum(rows, 'tpa'),
    ftm: sum(rows, 'ftm'),
    fta: sum(rows, 'fta'),
    off_reb: sum(rows, 'off_reb'),
    def_reb: sum(rows, 'def_reb'),
    steals: sum(rows, 'steals'),
    blocks: sum(rows, 'blocks'),
    fouls: sum(rows, 'fouls'),
    turnovers: sum(rows, 'turnovers'),
  };
  const topScorer = rows.reduce<NbaBoxLine | null>((b, p) => (!b || p.points > b.points ? p : b), null);

  return (
    <Card>
      <View style={styles.teamHead}>
        <TeamLogo uri={side === 'home' ? match.home_logo : match.away_logo} name={team} size={28} />
        <Text style={styles.teamName}>{team.toUpperCase() /* NBA adları İngilizce: Türkçe büyük harf "VİPERS" yapar */}</Text>
      </View>
      <View style={styles.tableWrap}>
        {/* Sabit oyuncu sütunu */}
        <View style={{ width: NAME_W }}>
          <Text style={[styles.th, styles.nameCell]} maxFontSizeMultiplier={1.3}>
            OYUNCU
          </Text>
          {ordered.map((p, i) => (
            <View key={`${p.name}-${i}`} style={[styles.nameRow, i === 0 && styles.firstRow]}>
              {/* En skorer: altın değil (Pro'ya ayrılmış), "★" öneki */}
              <Text style={styles.nameText} numberOfLines={1} maxFontSizeMultiplier={1.3}>
                {p === topScorer ? '★ ' : ''}
                {p.name}
              </Text>
              {p.starter && posLetter(p.position) ? (
                <Text style={styles.pos} maxFontSizeMultiplier={1.3}>
                  {posLetter(p.position)}
                </Text>
              ) : null}
            </View>
          ))}
          <View style={[styles.nameRow, styles.totalRow]}>
            <Text style={[styles.nameText, styles.totalText]} maxFontSizeMultiplier={1.3}>
              TOPLAM
            </Text>
          </View>
        </View>
        {/* Kaydırılabilir istatistik sütunları */}
        <ScrollView horizontal showsHorizontalScrollIndicator accessibilityLabel={`${team} box score tablosu`}>
          <View>
            <View style={styles.row}>
              {COLS.map((c) => (
                <Text key={c.label} style={[styles.th, styles.num, { width: c.width }]} maxFontSizeMultiplier={1.3}>
                  {c.label}
                </Text>
              ))}
            </View>
            {ordered.map((p, i) => (
              <View key={`${p.name}-${i}`} style={[styles.row, styles.cellRow, i === 0 && styles.firstRow]}>
                {COLS.map((c) => (
                  <Text
                    key={c.label}
                    style={[styles.td, styles.num, { width: c.width }, c.strong && styles.strong]}
                    maxFontSizeMultiplier={1.3}
                  >
                    {c.get(p)}
                  </Text>
                ))}
              </View>
            ))}
            <View style={[styles.row, styles.cellRow, styles.totalRow]}>
              {COLS.map((c) => (
                <Text
                  key={c.label}
                  style={[styles.td, styles.num, styles.totalText, { width: c.width }]}
                  maxFontSizeMultiplier={1.3}
                >
                  {c.get(total)}
                </Text>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
      <Text style={styles.scrollHint}>Tabloyu yana kaydır →</Text>
    </Card>
  );
}

const ROW_H = 36;

const styles = StyleSheet.create({
  empty: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  teamHead: { flexDirection: 'row', alignItems: 'center', gap: space(2) },
  teamName: { color: colors.text, fontWeight: '900', fontSize: 15, letterSpacing: 0.5 },
  tableWrap: { flexDirection: 'row' },
  row: { flexDirection: 'row' },
  cellRow: { height: ROW_H, borderTopWidth: 1, borderTopColor: colors.border, alignItems: 'center' },
  firstRow: { borderTopColor: colors.textDim },
  th: { height: ROW_H, lineHeight: ROW_H, color: colors.textDim, fontSize: 11, fontWeight: '800' },
  td: { color: colors.text, fontSize: 13 },
  num: { textAlign: 'center', fontVariant: ['tabular-nums'] },
  strong: { fontWeight: '900' },
  nameCell: { paddingRight: space(2) },
  nameRow: {
    height: ROW_H,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingRight: space(2),
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  nameText: { color: colors.text, fontSize: 13, fontWeight: '700', flexShrink: 1 },
  pos: { color: colors.textDim, fontSize: 10, fontWeight: '900' },
  totalRow: { borderTopColor: colors.borderStrong },
  totalText: { color: colors.text, fontWeight: '900' },
  legend: { color: colors.textDim, fontSize: 11, lineHeight: 16 },
  scrollHint: { color: colors.textDim, fontSize: 12, lineHeight: 17 },
});
