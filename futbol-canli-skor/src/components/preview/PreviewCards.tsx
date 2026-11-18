import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Match, PlayerForm, PreviewMatchup, PreviewPayload, TeamForm } from '@/lib/types';
import { colors, radius, space } from '@/theme';
import { CompareBar } from '../match/StatsBars';
import { Badge, Card, CardTitle } from '../ui';

type Side = 'home' | 'away';
const teamColor = (s: Side) => (s === 'home' ? colors.home : colors.away);
const teamName = (m: Match, s: Side) => (s === 'home' ? m.home_team : m.away_team);
const pct = (v: number | null) => (v == null ? '–' : `%${v}`);
const kickoff = (iso: string) => new Date(iso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

const BASIS: Record<PreviewPayload['data_basis'], string> = {
  api_last5: 'Form: iki takımın son 5 maçı (API)',
  db_history: 'Form: Skor+ veritabanındaki son maçlar',
  mixed: 'Form: API + Skor+ veritabanı',
  lineups_only: 'Yorum ilk 11 ve dizilişe dayanıyor',
};

// ─────────────────────────────────────────────── 1) Başlık
function HeaderCard({ p }: { p: PreviewPayload }) {
  return (
    <Card accent={colors.pro} style={{ backgroundColor: colors.surfaceAlt }}>
      <Badge label="✦ MAÇ ÖNÜ AI · TAKTİKSEL EŞLEŞME" color={colors.pro} />
      <Text style={styles.headline}>{p.headline}</Text>
      <Text style={styles.body}>{p.overview}</Text>
    </Card>
  );
}

// ─────────────────────────────────────────────── 2) Diziliş
function FormationCard({ p, match }: { p: PreviewPayload; match: Match }) {
  const col = (s: Side) => (
    <View style={{ flex: 1, gap: 4 }}>
      <Text style={[styles.teamLabel, { color: teamColor(s) }]} numberOfLines={1}>{teamName(match, s)}</Text>
      <Text style={styles.formation}>{p.lineups[s].formation}</Text>
      {p.lineups[s].coach ? <Text style={styles.meta}>TD {p.lineups[s].coach}</Text> : null}
      <Text style={styles.xi} numberOfLines={4}>
        {p.lineups[s].xi.map((x) => x.name).join(' · ')}
      </Text>
    </View>
  );
  return (
    <Card>
      <CardTitle kickerColor={colors.pro} kicker="İLK 11 & DİZİLİŞ" title="Formasyon çatışması" />
      <View style={styles.grid}>
        {col('home')}
        <View style={styles.vDivider} />
        {col('away')}
      </View>
    </Card>
  );
}

// ─────────────────────────────────────────────── 3) Form
function ResultsChips({ results }: { results: string }) {
  const c = (r: string) => (r === 'G' ? colors.live : r === 'M' ? colors.danger : colors.textMuted);
  return (
    <View style={styles.chips}>
      {results
        .split('-')
        .filter(Boolean)
        .map((r, i) => (
          <View key={i} style={[styles.chip, { borderColor: c(r) }]}>
            <Text style={[styles.chipText, { color: c(r) }]}>{r}</Text>
          </View>
        ))}
    </View>
  );
}

const trendText = (f: TeamForm) =>
  !f.trend ? null : `xG trendi ${f.trend.dir === 'up' ? '↑ yükselişte' : f.trend.dir === 'down' ? '↓ düşüşte' : '→ yatay'} (son 2: ${f.trend.recent} · önceki: ${f.trend.earlier})`;

function FormCard({ p, match }: { p: PreviewPayload; match: Match }) {
  const { home: h, away: a } = p.form;
  if (!h.n && !a.n) return null;
  const bar = (label: string, hv: number | null, av: number | null, fmt?: (v: number) => string) =>
    hv != null && av != null ? <CompareBar label={label} home={hv} away={av} fmt={fmt} /> : null;
  return (
    <Card>
      <CardTitle kickerColor={colors.pro} kicker="FORM" title={`Son ${Math.max(h.n, a.n)} maç karşılaştırması`} />
      <View style={styles.grid}>
        {(['home', 'away'] as const).map((s) => (
          <View key={s} style={{ flex: 1, gap: 4 }}>
            <Text style={[styles.teamLabel, { color: teamColor(s) }]} numberOfLines={1}>{teamName(match, s)}</Text>
            <ResultsChips results={p.form[s].results} />
            {trendText(p.form[s]) ? <Text style={styles.meta}>{trendText(p.form[s])}</Text> : null}
          </View>
        ))}
      </View>
      {bar('xG (ürettiği)', h.xg_for, a.xg_for, (v) => v.toFixed(2))}
      {bar('xG (yediği)', h.xg_against, a.xg_against, (v) => v.toFixed(2))}
      {bar('Maç başı şut', h.shots, a.shots, (v) => v.toFixed(1))}
      {bar('Topla oynama', h.possession, a.possession, (v) => `%${v}`)}
    </Card>
  );
}

// ─────────────────────────────────────────────── 4) Kilit eşleşme
function PlayerBox({ name, pos, form, color, role }: { name: string; pos: string; form: PlayerForm | null; color: string; role: string }) {
  return (
    <View style={[styles.playerBox, { borderColor: color }]}>
      <Text style={[styles.role, { color }]}>{role}</Text>
      <Text style={styles.playerName} numberOfLines={1}>{name}</Text>
      <Text style={styles.meta}>{form ? `${pos} · ${form.matches} maç, ${form.minutes} dk` : pos}</Text>
      {form ? (
        <View style={{ gap: 2, marginTop: 4 }}>
          <Text style={styles.statLine}>İkili mücadele <Text style={styles.statVal}>{pct(form.duel_pct)}</Text></Text>
          <Text style={styles.statLine}>Çalım <Text style={styles.statVal}>{pct(form.dribble_pct)}</Text> · {form.dribbles_90}/90</Text>
          <Text style={styles.statLine}>Top kapma+kesme <Text style={styles.statVal}>{form.tkl_int_90}</Text>/90</Text>
          <Text style={styles.statLine}>Çalımla geçilme <Text style={styles.statVal}>{form.dribbled_past_90}</Text>/90</Text>
          <Text style={styles.statLine}>Kilit pas <Text style={styles.statVal}>{form.key_passes_90}</Text>/90</Text>
        </View>
      ) : null}
    </View>
  );
}

/** İstatistik karşılaştırması yoksa rozet gösterilmez (boş "veri yetersiz" etiketi yerine) */
const edgeLabel = (m: PreviewMatchup) =>
  m.edge == null ? null : m.edge > 0 ? `hücumcu +${m.edge}` : m.edge < 0 ? `savunmacı +${-m.edge}` : 'dengede';
const edgeColor = (m: PreviewMatchup) => (m.edge == null ? colors.textMuted : m.edge > 0 ? colors.warning : m.edge < 0 ? colors.live : colors.accent);

function KeyMatchupCard({ p, match }: { p: PreviewPayload; match: Match }) {
  const k = p.key_matchup_index != null ? p.matchups[p.key_matchup_index] : null;
  const label = k ? edgeLabel(k) : null;
  return (
    <Card>
      <CardTitle
        kickerColor={colors.pro}
        kicker={k ? 'KİLİT EŞLEŞME' : 'KİLİT BÖLGE'}
        title={k ? `${teamName(match, k.attacking_side)} · ${k.zone}` : 'Dizilişten okuma'}
        right={label ? <Badge label={label.toLocaleUpperCase('tr-TR')} color={edgeColor(k!)} /> : undefined}
      />
      {k ? (
        <View style={styles.vs}>
          <PlayerBox {...k.attacker} color={teamColor(k.attacking_side)} role="HÜCUM" />
          <Text style={styles.vsText}>vs</Text>
          <PlayerBox {...k.defender} color={teamColor(k.attacking_side === 'home' ? 'away' : 'home')} role="SAVUNMA" />
        </View>
      ) : null}
      <Text style={styles.body}>{p.key_matchup_commentary}</Text>
    </Card>
  );
}

// ─────────────────────────────────────────────── 5) Tüm kanat eşleşmeleri
function MatchupsCard({ p, match }: { p: PreviewPayload; match: Match }) {
  if (!p.matchups.length) return null;
  const hasStats = p.matchups.some((m) => m.edge != null);
  const duel = (v: number | null | undefined) => (v == null ? null : <Text style={styles.meta}> ({pct(v)})</Text>);
  return (
    <Card>
      <CardTitle kickerColor={colors.pro} kicker="KANAT EŞLEŞMELERİ" title="Bek ↔ kanat düelloları" />
      {p.matchups.map((m, i) => (
        <View key={i} style={[styles.mRow, i === p.key_matchup_index && styles.mRowKey]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.meta, { color: teamColor(m.attacking_side) }]}>
              {teamName(match, m.attacking_side)} · {m.zone}
            </Text>
            <Text style={styles.mNames} numberOfLines={1}>
              {m.attacker.name}
              {duel(m.attacker.form?.duel_pct)} ↔ {m.defender.name}
              {duel(m.defender.form?.duel_pct)}
            </Text>
          </View>
          {edgeLabel(m) ? <Badge label={edgeLabel(m)!} color={edgeColor(m)} /> : null}
        </View>
      ))}
      <Text style={styles.note}>
        {hasStats ? 'Yüzdeler oyuncuların son maçlardaki ikili mücadele kazanma oranıdır. ' : ''}Kanat, hücum eden takımın gözünden.
      </Text>
    </Card>
  );
}

// ─────────────────────────────────────────────── 6) Kırılma senaryosu
function ScenarioCard({ p }: { p: PreviewPayload }) {
  return (
    <Card>
      <CardTitle kickerColor={colors.pro} kicker="KIRILMA SENARYOSU" title="Maçın kilidi" />
      <Text style={styles.body}>{p.breaking_scenario}</Text>
      {p.watch_list.length ? (
        <View style={{ gap: space(1.5) }}>
          <Text style={styles.sectionTitle}>👁 İzlenecekler</Text>
          {p.watch_list.map((w, i) => (
            <Text key={i} style={styles.bodySmall}>
              • {w}
            </Text>
          ))}
        </View>
      ) : null}
    </Card>
  );
}

// ─────────────────────────────────────────────── 7) Eksikler
function AbsencesCard({ p, match }: { p: PreviewPayload; match: Match }) {
  if (!p.absences.length) return null;
  return (
    <Card>
      <CardTitle kickerColor={colors.pro} kicker="EKSİKLER" title="Sakat / cezalı oyuncular" />
      {p.absences.map((a, i) => (
        <View key={i} style={styles.absRow}>
          {a.regular_starter ? <Badge label="DÜZENLİ İLK 11" color={colors.danger} /> : null}
          <Text style={styles.mNames}>{a.name}</Text>
          <Text style={[styles.meta, { color: teamColor(a.side) }]}>{teamName(match, a.side)}</Text>
          <Text style={styles.meta}>· {a.reason}</Text>
        </View>
      ))}
      {p.absences_commentary ? <Text style={styles.bodySmall}>{p.absences_commentary}</Text> : null}
    </Card>
  );
}

export function PreviewReport({ p, match }: { p: PreviewPayload; match: Match }) {
  return (
    <View style={{ gap: space(3) }}>
      <HeaderCard p={p} />
      <KeyMatchupCard p={p} match={match} />
      <ScenarioCard p={p} />
      <FormationCard p={p} match={match} />
      <FormCard p={p} match={match} />
      <MatchupsCard p={p} match={match} />
      <AbsencesCard p={p} match={match} />
      <Text style={styles.note}>{BASIS[p.data_basis]}. Kanat bazlı hücum yoğunluğu verisi kullanılmaz.</Text>
      <Text style={styles.aiNote}>AI tarafından üretildi, maç verisine dayanır. Hata görürsen bildir.</Text>
    </View>
  );
}

// ─────────────────────────────────────────────── durum kartları

/** İlk 11 henüz açıklanmadı */
export function PreviewTooEarly({ match }: { match: Match }) {
  return (
    <Card accent={colors.pro}>
      <Badge label="✦ MAÇ ÖNÜ AI" color={colors.pro} />
      <Text style={styles.cardTitle}>{"İlk 11'ler açıklanınca hazır"}</Text>
      <Text style={styles.bodySmall}>
        Maç {kickoff(match.kickoff_at)}{"'te"} başlıyor. Kadrolar genellikle başlamadan 20-40 dakika önce açıklanır; taktiksel
        eşleşme analizi başlamaya 45 dakika kala açılır.
      </Text>
    </Card>
  );
}

/** Pro'ya özel: kilitli görünüm (kadro açıklandıysa diziliş ücretsiz gösterilir) */
export function PreviewLocked({ match }: { match: Match }) {
  const l = match.lineups;
  return (
    <Card accent={colors.pro}>
      <Text style={styles.lock}>🔒</Text>
      <Text style={styles.cardTitle}>Maç önü taktik eşleşme Pro üyelere özel</Text>
      {l ? (
        <Text style={styles.bodySmall}>
          Diziliş: {match.home_team} {l.home.formation} · {match.away_team} {l.away.formation}
        </Text>
      ) : null}
      <Text style={styles.bodySmall}>Kilit kanat eşleşmesi, son 5 maç formu, eksikler ve maçın kırılma senaryosu.</Text>
      <Pressable accessibilityRole="button" onPress={() => router.push('/paywall')} style={({ pressed }) => [styles.button, pressed && { opacity: 0.85 }]}>
        <Text style={styles.buttonText}>{"Pro'ya Geçerek Maç Önü Analizi Aç"}</Text>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  headline: { color: colors.text, fontSize: 21, fontWeight: '900', lineHeight: 27 },
  body: { color: colors.text, fontSize: 14, lineHeight: 21 },
  aiNote: { color: colors.textMuted, fontSize: 12, lineHeight: 17 },
  bodySmall: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  meta: { color: colors.textMuted, fontSize: 12 },
  note: { color: colors.textDim, fontSize: 11, lineHeight: 15 },
  cardTitle: { color: colors.text, fontWeight: '900', fontSize: 16 },
  sectionTitle: { color: colors.text, fontWeight: '800', fontSize: 14 },
  teamLabel: { fontSize: 12, fontWeight: '800' },
  grid: { flexDirection: 'row', gap: space(3) },
  vDivider: { width: 1, backgroundColor: colors.border },
  formation: { color: colors.text, fontSize: 26, fontWeight: '900', fontVariant: ['tabular-nums'] },
  xi: { color: colors.textMuted, fontSize: 11, lineHeight: 16, marginTop: 2 },
  chips: { flexDirection: 'row', gap: 4, flexWrap: 'wrap' },
  chip: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  chipText: { fontWeight: '900', fontSize: 11 },
  vs: { flexDirection: 'row', alignItems: 'stretch', gap: space(2) },
  vsText: { color: colors.textDim, fontWeight: '900', alignSelf: 'center' },
  playerBox: { flex: 1, borderWidth: 1.5, borderRadius: radius.md, padding: space(2.5), backgroundColor: colors.surfaceAlt },
  role: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  playerName: { color: colors.text, fontWeight: '900', fontSize: 15 },
  statLine: { color: colors.textMuted, fontSize: 12 },
  statVal: { color: colors.text, fontWeight: '800' },
  mRow: { flexDirection: 'row', alignItems: 'center', gap: space(2), paddingVertical: space(2), borderTopWidth: 1, borderTopColor: colors.border },
  mRowKey: { backgroundColor: 'rgba(255,162,58,0.06)' },
  mNames: { color: colors.text, fontWeight: '700', fontSize: 13, flexShrink: 1 },
  absRow: { flexDirection: 'row', alignItems: 'center', gap: space(2), flexWrap: 'wrap' },
  lock: { fontSize: 26 },
  button: { marginTop: space(2), backgroundColor: colors.pro, borderRadius: radius.md, paddingVertical: space(3.5), paddingHorizontal: space(4) },
  buttonText: { color: colors.bg, fontWeight: '900', fontSize: 15, textAlign: 'center' },
});
