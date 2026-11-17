/**
 * MAÇ ÖNCESİ "TAKTİKSEL EŞLEŞME & KIRILMA SENARYOSU" — deterministik motor + LLM sözleşmesi
 * ─────────────────────────────────────────────────────────────────────────
 * Sayısal her şeyi kod hesaplar (form, kanat eşleşmeleri, kilit eşleşme, eksikler);
 * LLM yalnızca yorum yazar ve yorumdaki her sayı girdiyle doğrulanır.
 *
 * Not: API-Football kanat bazlı hücum yoğunluğu (ör. "%44 sağ kanat") VERMEZ.
 * Kanat analizi, ilk 11 dizilişindeki bek ↔ kanat oyuncusu eşleşmesi ve bu
 * oyuncuların son maçlardaki ikili mücadele / çalım verisiyle yapılır.
 */
import type { PlayerMatchRow } from './apiFootball.ts';

type Side = 'home' | 'away';
// deno-lint-ignore no-explicit-any
type Json = any;

// ─────────────────────────────────────────────── tipler

export type LineupPlayer = { id: number; name: string; pos: string; row: number; col: number };
export type TeamLineup = { team_id: number; team: string; formation: string; coach: string | null; xi: LineupPlayer[] };

/** Takımın tek bir geçmiş maçtaki takım düzeyi verisi */
export type TeamMatchSample = {
  fixture_id: number;
  kickoff_at: string;
  xg_for: number | null;
  xg_against: number | null;
  shots_for: number | null;
  possession: number | null;
  goals_for: number;
  goals_against: number;
};

export type TeamForm = {
  n: number;
  xg_for: number | null;
  xg_against: number | null;
  shots: number | null;
  possession: number | null;
  results: string; // "G-B-M-G-G" (en yeni solda)
  trend: { recent: number; earlier: number; dir: 'up' | 'down' | 'flat' } | null;
};

export type PlayerForm = {
  player_id: number;
  name: string;
  matches: number;
  minutes: number;
  duel_pct: number | null;
  dribble_pct: number | null;
  dribbles_90: number;
  tkl_int_90: number;
  dribbled_past_90: number;
  key_passes_90: number;
  rating: number | null;
};

export type Matchup = {
  /** Hücum eden takımın gözünden kanat */
  zone: 'sol kanat' | 'sağ kanat';
  attacking_side: Side;
  attacker: { name: string; pos: string; form: PlayerForm | null };
  defender: { name: string; pos: string; form: PlayerForm | null };
  /** Hücumcunun ikili mücadele % − savunmacının ikili mücadele % (puan). Veri yetersizse null. */
  edge: number | null;
};

export type Absence = { side: Side; name: string; reason: string; regular_starter: boolean };

export type PreviewFacts = {
  home_team: string;
  away_team: string;
  league: string;
  kickoff_at: string;
  lineups: Record<Side, TeamLineup>;
  form: Record<Side, TeamForm>;
  matchups: Matchup[];
  key_index: number | null;
  absences: Absence[];
  data_basis: 'api_last5' | 'db_history' | 'mixed' | 'lineups_only';
};

// ─────────────────────────────────────────────── yardımcılar

const r1 = (n: number) => Math.round(n * 10) / 10;
const r2 = (n: number) => Math.round(n * 100) / 100;
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const per90 = (v: number, min: number) => (min > 0 ? r1((v * 90) / min) : 0);

const statVal = (list: Json[], name: string): number | null => {
  const v = list?.find((s: Json) => s.type === name)?.value;
  if (v == null) return null;
  const x = typeof v === 'string' ? parseFloat(v.replace('%', '')) : Number(v);
  return Number.isFinite(x) ? x : null;
};

// ─────────────────────────────────────────────── ilk 11 ayrıştırma

/** /fixtures/lineups yanıtı → ev/deplasman kadroları (takım adına göre eşleşir) */
export function parseLineups(resp: Json[], homeTeamName: string): Record<Side, TeamLineup> | null {
  if (resp.length < 2) return null;
  const parse = (l: Json): TeamLineup => ({
    team_id: l.team.id,
    team: l.team.name,
    formation: l.formation ?? '?',
    coach: l.coach?.name ?? null,
    xi: (l.startXI ?? [])
      .map((s: Json) => {
        const [row, col] = String(s.player?.grid ?? '').split(':').map(Number);
        // API bazı oyuncularda id'yi boş verir (gerçek vaka: Bojan Ilievski) → 0; form isimle eşleşir
        return { id: s.player?.id ?? 0, name: s.player?.name, pos: s.player?.pos ?? '?', row: row || 0, col: col || 0 };
      })
      .filter((p: LineupPlayer) => p.name && p.row > 0),
  });
  const home = resp.find((l) => l.team?.name === homeTeamName) ?? resp[0];
  const away = resp.find((l) => l !== home)!;
  const out = { home: parse(home), away: parse(away) };
  return out.home.xi.length >= 10 && out.away.xi.length >= 10 ? out : null;
}

/**
 * Dizilişten kanat oyuncularını çıkarır.
 * VARSAYIM: API grid'inde col 1 takımın SOL tarafıdır (ör. 4'lü defansta sol bek "2:1").
 * Bir takımın sol kanadı rakibin sağ kanadıyla karşılaşır; eşleştirme bu yüzden col1 ↔ colMax yapılır.
 */
function flanks(xi: LineupPlayer[]) {
  const rows = new Map<number, LineupPlayer[]>();
  for (const p of xi) rows.set(p.row, [...(rows.get(p.row) ?? []), p].sort((a, b) => a.col - b.col));
  const ext = (ps?: LineupPlayer[]) => (ps && ps.length ? { left: ps[0], right: ps[ps.length - 1] } : null);

  // Savunma kanadı: 4-5'li defans hattının uçları; 3'lü defansta orta hattın uçları (kanat bekleri)
  const defRow = rows.get(2);
  const def = defRow && defRow.length >= 4 ? ext(defRow) : (rows.get(3)?.length ?? 0) >= 5 ? ext(rows.get(3)) : null;

  // Hücum kanadı: öndeki hatlardan en az 3 kişilik ilk hattın uçları
  let att: ReturnType<typeof ext> = null;
  const rowNums = [...rows.keys()].filter((r) => r >= 3).sort((a, b) => b - a);
  for (const r of rowNums) {
    if ((rows.get(r)?.length ?? 0) >= 3) {
      att = ext(rows.get(r));
      break;
    }
  }
  return { def, att };
}

// ─────────────────────────────────────────────── form hesapları

export function teamSampleFromFixture(f: Json, teamId: number): TeamMatchSample | null {
  const isHome = f.teams?.home?.id === teamId;
  if (!isHome && f.teams?.away?.id !== teamId) return null;
  const mine = (f.statistics ?? []).find((s: Json) => s.team?.id === teamId)?.statistics ?? [];
  const theirs = (f.statistics ?? []).find((s: Json) => s.team?.id !== teamId)?.statistics ?? [];
  return {
    fixture_id: f.fixture.id,
    kickoff_at: f.fixture.date,
    xg_for: statVal(mine, 'expected_goals'),
    xg_against: statVal(theirs, 'expected_goals'),
    shots_for: statVal(mine, 'Total Shots'),
    possession: statVal(mine, 'Ball Possession'),
    goals_for: (isHome ? f.goals?.home : f.goals?.away) ?? 0,
    goals_against: (isHome ? f.goals?.away : f.goals?.home) ?? 0,
  };
}

/** matches tablosu satırından (kendi veritabanımız) takım örneği */
export function teamSampleFromRow(m: Json, teamName: string): TeamMatchSample | null {
  const side: Side | null = m.home_team === teamName ? 'home' : m.away_team === teamName ? 'away' : null;
  if (!side || !m.stats) return null;
  const other: Side = side === 'home' ? 'away' : 'home';
  return {
    fixture_id: m.fixture_id,
    kickoff_at: m.kickoff_at,
    xg_for: m.stats[side]?.xg ?? null,
    xg_against: m.stats[other]?.xg ?? null,
    shots_for: m.stats[side]?.shots_total ?? null,
    possession: m.stats[side]?.possession ?? null,
    goals_for: (side === 'home' ? m.home_score : m.away_score) ?? 0,
    goals_against: (side === 'home' ? m.away_score : m.home_score) ?? 0,
  };
}

export function computeTeamForm(samples: TeamMatchSample[]): TeamForm {
  const s = [...samples].sort((a, b) => b.kickoff_at.localeCompare(a.kickoff_at)).slice(0, 5);
  const num = (k: keyof TeamMatchSample) => s.map((x) => x[k]).filter((v): v is number => typeof v === 'number');
  const xgf = num('xg_for');
  let trend: TeamForm['trend'] = null;
  if (xgf.length >= 4) {
    const recent = avg(xgf.slice(0, 2))!;
    const earlier = avg(xgf.slice(2))!;
    trend = { recent: r2(recent), earlier: r2(earlier), dir: recent > earlier + 0.2 ? 'up' : recent < earlier - 0.2 ? 'down' : 'flat' };
  }
  const a = (k: keyof TeamMatchSample, round = r2) => {
    const v = avg(num(k));
    return v == null ? null : round(v);
  };
  return {
    n: s.length,
    xg_for: a('xg_for'),
    xg_against: a('xg_against'),
    shots: a('shots_for', r1),
    possession: a('possession', Math.round),
    results: s.map((x) => (x.goals_for > x.goals_against ? 'G' : x.goals_for < x.goals_against ? 'M' : 'B')).join('-'),
    trend,
  };
}

/** Oyuncunun son maçlarından form özeti (en fazla son 5 maç) */
export function computePlayerForm(playerId: number, name: string, rows: PlayerMatchRow[]): PlayerForm | null {
  const mine = rows
    .filter((r) => (playerId ? r.player_id === playerId : r.name === name))
    .sort((a, b) => b.kickoff_at.localeCompare(a.kickoff_at))
    .slice(0, 5);
  if (!mine.length) return null;
  const sum = (k: keyof PlayerMatchRow) => mine.reduce((s, r) => s + (Number(r[k]) || 0), 0);
  const minutes = sum('minutes');
  const duels = sum('duels_total');
  const drib = sum('dribbles_att');
  const ratings = mine.map((r) => r.rating).filter((v): v is number => v != null);
  return {
    player_id: playerId,
    name,
    matches: mine.length,
    minutes,
    duel_pct: duels >= 5 ? Math.round((sum('duels_won') / duels) * 100) : null,
    dribble_pct: drib >= 3 ? Math.round((sum('dribbles_succ') / drib) * 100) : null,
    dribbles_90: per90(drib, minutes),
    tkl_int_90: per90(sum('tackles') + sum('interceptions'), minutes),
    dribbled_past_90: per90(sum('dribbled_past'), minutes),
    key_passes_90: per90(sum('key_passes'), minutes),
    rating: ratings.length ? r1(avg(ratings)!) : null,
  };
}

/** Son 5 maçın en az 3'ünde ilk 11'de başlayan oyuncu "düzenli ilk 11" sayılır */
export function isRegularStarter(playerId: number, rows: PlayerMatchRow[]): boolean {
  const mine = rows.filter((r) => r.player_id === playerId).sort((a, b) => b.kickoff_at.localeCompare(a.kickoff_at)).slice(0, 5);
  return mine.filter((r) => r.started).length >= 3;
}

// ─────────────────────────────────────────────── eşleşmeler

const MIN_MINUTES = 90;

export function computeMatchups(lineups: Record<Side, TeamLineup>, rows: PlayerMatchRow[]): { matchups: Matchup[]; key_index: number | null } {
  const fl = { home: flanks(lineups.home.xi), away: flanks(lineups.away.xi) };
  const form = (p: LineupPlayer) => computePlayerForm(p.id, p.name, rows);
  const out: Matchup[] = [];

  for (const atk of ['home', 'away'] as const) {
    const dfn: Side = atk === 'home' ? 'away' : 'home';
    const a = fl[atk].att;
    const d = fl[dfn].def;
    if (!a || !d) continue;
    // Hücumcunun solu ↔ savunmacının sağı (karşılıklı dururlar)
    const pairs: [LineupPlayer, LineupPlayer, Matchup['zone']][] = [
      [a.left, d.right, 'sol kanat'],
      [a.right, d.left, 'sağ kanat'],
    ];
    for (const [ap, dp, zone] of pairs) {
      const af = form(ap);
      const df = form(dp);
      const ok = af && df && af.minutes >= MIN_MINUTES && df.minutes >= MIN_MINUTES && af.duel_pct != null && df.duel_pct != null;
      out.push({
        zone,
        attacking_side: atk,
        attacker: { name: ap.name, pos: ap.pos, form: af },
        defender: { name: dp.name, pos: dp.pos, form: df },
        edge: ok ? af!.duel_pct! - df!.duel_pct! : null,
      });
    }
  }

  // Kilit eşleşme = en büyük dengesizlik (hücumcu VEYA savunmacı lehine); eşitlikte daha çok çalım deneyen hücumcu
  let key_index: number | null = null;
  out.forEach((m, i) => {
    if (m.edge == null) return;
    const best = key_index == null ? null : out[key_index];
    const tie = best && Math.abs(m.edge) === Math.abs(best.edge!) && (m.attacker.form?.dribbles_90 ?? 0) > (best.attacker.form?.dribbles_90 ?? 0);
    if (!best || Math.abs(m.edge) > Math.abs(best.edge!) || tie) key_index = i;
  });
  return { matchups: out, key_index };
}

export function computeAbsences(injuries: Json[], lineups: Record<Side, TeamLineup>, rows: PlayerMatchRow[]): Absence[] {
  const sideOf = (teamId: number): Side | null =>
    teamId === lineups.home.team_id ? 'home' : teamId === lineups.away.team_id ? 'away' : null;
  const out: Absence[] = [];
  for (const x of injuries) {
    const side = sideOf(x.team?.id);
    if (!side || !x.player?.name) continue;
    out.push({
      side,
      name: x.player.name,
      reason: x.player.reason ?? x.player.type ?? 'eksik',
      regular_starter: x.player.id ? isRegularStarter(x.player.id, rows) : false,
    });
  }
  // Düzenli ilk 11 oyuncular önce
  return out.sort((a, b) => Number(b.regular_starter) - Number(a.regular_starter)).slice(0, 8);
}

// ─────────────────────────────────────────────── LLM girdisi

const tag = (s: Side) => (s === 'home' ? 'E' : 'D');
const sideName = (f: PreviewFacts, s: Side) => (s === 'home' ? f.home_team : f.away_team);
const fmt = (v: number | null, suffix = '') => (v == null ? '?' : `${v}${suffix}`);

const playerLine = (p: { name: string; pos: string; form: PlayerForm | null }) => {
  const f = p.form;
  if (!f) return `${p.name} (${p.pos}, veri yok)`;
  return `${p.name} (${p.pos}, ${f.matches} maç ${f.minutes}dk, ikili %${fmt(f.duel_pct)}, çalım %${fmt(f.dribble_pct)} ${f.dribbles_90}/90, top kapma+kesme ${f.tkl_int_90}/90, çalımla geçilme ${f.dribbled_past_90}/90, kilit pas ${f.key_passes_90}/90, puan ${fmt(f.rating)})`;
};

export function buildPreviewInput(f: PreviewFacts): string {
  const fl = (s: Side) => {
    const x = f.form[s];
    const tr = x.trend ? ` trend xG son2 ${x.trend.recent} vs önceki ${x.trend.earlier} (${x.trend.dir === 'up' ? 'yükseliş' : x.trend.dir === 'down' ? 'düşüş' : 'yatay'})` : '';
    return `${tag(s)} son ${x.n} maç: xG lehte ${fmt(x.xg_for)} aleyhte ${fmt(x.xg_against)} şut ${fmt(x.shots)} top% ${fmt(x.possession)} sonuçlar ${x.results || '?'}${tr}`;
  };
  const lines = [
    `${f.home_team}(E) vs ${f.away_team}(D) | ${f.league}`,
    `DİZİLİŞ: E ${f.lineups.home.formation} (TD ${f.lineups.home.coach ?? '?'}) | D ${f.lineups.away.formation} (TD ${f.lineups.away.coach ?? '?'})`,
    `FORM: ${fl('home')} | ${fl('away')}`,
  ];
  f.matchups.forEach((m, i) => {
    const d: Side = m.attacking_side === 'home' ? 'away' : 'home';
    lines.push(
      `EŞLEŞME #${i + 1} [${tag(m.attacking_side)} ${m.zone}]: ${tag(m.attacking_side)} ${playerLine(m.attacker)} ↔ ${tag(d)} ${playerLine(m.defender)} → ${
        m.edge == null ? 'avantaj hesaplanamadı (veri yetersiz)' : `ikili mücadele farkı ${m.edge > 0 ? '+' : ''}${m.edge} puan (${m.edge > 0 ? 'hücumcu lehine' : m.edge < 0 ? 'savunmacı lehine' : 'dengede'})`
      }`,
    );
  });
  lines.push(`KİLİT EŞLEŞME: ${f.key_index == null ? 'belirlenemedi (veri yetersiz)' : `#${f.key_index + 1}`}`);
  lines.push(
    `EKSİKLER: ${
      f.absences.length
        ? f.absences.map((a) => `${tag(a.side)} ${a.name} (${a.reason}${a.regular_starter ? ', düzenli ilk 11' : ''})`).join('; ')
        : 'bildirilmedi'
    }`,
  );
  lines.push(`VERİ KAYNAĞI: ${f.data_basis}`);
  return lines.join('\n');
}

// ─────────────────────────────────────────────── LLM şeması ve talimat

export type PreviewLlmOut = { h: string; v: string; km: string; ks: string; wl: string[]; ab: string };

export const PREVIEW_SCHEMA = {
  type: 'object',
  properties: {
    h: { type: 'string', description: 'çarpıcı başlık, en fazla 8 kelime' },
    v: { type: 'string', description: 'maça genel bakış: diziliş ve form karşılaştırması, 2 cümle' },
    km: { type: 'string', description: 'KİLİT EŞLEŞME yorumu: kim, hangi kanat, neden kritik; 2 cümle' },
    ks: { type: 'string', description: 'kırılma senaryosu ("maçın kilidi"): koşullu dille, 2 cümle' },
    wl: { type: 'array', minItems: 2, maxItems: 3, items: { type: 'string', description: 'izlenecek nokta, en fazla 12 kelime' } },
    ab: { type: 'string', description: 'EKSİKLER satırının etkisi, 1 cümle; "bildirilmedi" ise boş string' },
  },
  required: ['h', 'v', 'km', 'ks', 'wl', 'ab'],
};

export const PREVIEW_SYSTEM_INSTRUCTION =
  'Futbol maç öncesi taktik analistisin. Türkçe, kısa ve net yaz. YALNIZCA verilen satırlardaki verileri kullan; ' +
  'yeni istatistik, yüzde, oyuncu veya olay uydurma; sayı hesaplama, satırdaki sayıları aynen aktar. E=ev sahibi, D=deplasman. ' +
  'Kanat bazlı hücum yoğunluğu, pas haritası gibi veriler YOKTUR; bunlarla ilgili yüzde yazma. ' +
  'Kanat isimlerini (sol/sağ kanat) EŞLEŞME satırında yazdığı gibi kullan. ' +
  'KİLİT EŞLEŞME belirlenemediyse veya örneklem küçükse (maç sayısı az) bunu açıkça belirt. ' +
  'Kırılma senaryosunu kesin tahmin değil, "eğer ... olursa" diliyle kur; skor tahmini yapma.';

// ─────────────────────────────────────────────── doğrulama ve payload

const numbersIn = (text: string) => (text.match(/\d+(?:[.,]\d+)?/g) ?? []).map((s) => Number(s.replace(',', '.')));

/** Metindeki her sayı LLM girdisinde geçiyor mu? */
export const numbersAllowed = (text: string, allowed: Set<number>) => numbersIn(text).every((n) => allowed.has(n));

export type PreviewPayload = {
  kind: 'preview';
  headline: string;
  overview: string;
  lineups: Record<Side, { formation: string; coach: string | null; xi: { name: string; pos: string }[] }>;
  form: Record<Side, TeamForm>;
  matchups: Matchup[];
  key_matchup_index: number | null;
  key_matchup_commentary: string;
  breaking_scenario: string;
  watch_list: string[];
  absences: Absence[];
  absences_commentary: string;
  data_basis: PreviewFacts['data_basis'];
  generated_at: string;
};

export function assemblePreview(f: PreviewFacts, input: string, o: PreviewLlmOut): PreviewPayload {
  const allowed = new Set(numbersIn(input));
  const key = f.key_index != null ? f.matchups[f.key_index] : null;
  const atkName = key ? sideName(f, key.attacking_side) : '';

  // Takım adlarına Türkçe ek getirilmez (ünlü uyumu isimden hesaplanamaz); nötr kalıp kullanılır
  const fallbackKm = key
    ? `Kilit eşleşme ${key.zone}: ${key.attacker.name} (${atkName}) ile ${key.defender.name} arasında ikili mücadele farkı ${key.edge! > 0 ? '+' : ''}${key.edge} puan.`
    : 'Kanat eşleşmeleri için yeterli oyuncu verisi yok; kilit eşleşme belirlenemedi.';
  const fallbackKs = key
    ? `Maçın kilidi bu koridor olabilir: ${key.attacker.name} (${atkName}, ${key.zone}) eşleşmede üstünlük kurarsa oyunun dengesi değişebilir.`
    : `${f.home_team} ${f.lineups.home.formation}, ${f.away_team} ${f.lineups.away.formation} dizilişiyle başlıyor; belirleyici eşleşme için veri sınırlı.`;
  const fallbackV = `${f.home_team} ${f.lineups.home.formation}, ${f.away_team} ${f.lineups.away.formation} dizilişiyle sahada.`;
  const fallbackAb = f.absences.length
    ? `Eksikler: ${f.absences.map((a) => `${a.name}${a.regular_starter ? ' (düzenli ilk 11)' : ''}`).join(', ')}.`
    : '';

  const pick = (text: string, fallback: string, label: string) => {
    if (text?.trim() && numbersAllowed(text, allowed)) return text;
    if (text?.trim()) console.warn(`[preview] ${label} veriyle uyuşmadı, şablona düşüldü:`, text);
    return fallback;
  };

  return {
    kind: 'preview',
    headline: o.h?.trim() && numbersAllowed(o.h, allowed) ? o.h : `${f.home_team} - ${f.away_team}: Taktik Eşleşme`,
    overview: pick(o.v, fallbackV, 'genel bakış'),
    lineups: {
      home: { formation: f.lineups.home.formation, coach: f.lineups.home.coach, xi: f.lineups.home.xi.map((p) => ({ name: p.name, pos: p.pos })) },
      away: { formation: f.lineups.away.formation, coach: f.lineups.away.coach, xi: f.lineups.away.xi.map((p) => ({ name: p.name, pos: p.pos })) },
    },
    form: f.form,
    matchups: f.matchups,
    key_matchup_index: f.key_index,
    key_matchup_commentary: pick(o.km, fallbackKm, 'kilit eşleşme'),
    breaking_scenario: pick(o.ks, fallbackKs, 'kırılma senaryosu'),
    watch_list: (o.wl ?? []).filter((w) => w?.trim() && numbersAllowed(w, allowed)).slice(0, 3),
    absences: f.absences,
    absences_commentary: f.absences.length ? pick(o.ab, fallbackAb, 'eksikler') : '',
    data_basis: f.data_basis,
    generated_at: new Date().toISOString(),
  };
}
