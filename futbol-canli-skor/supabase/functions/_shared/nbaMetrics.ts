/**
 * NBA DETERMİNİSTİK ÖN-HESAPLAMA MOTORU
 * ─────────────────────────────────────
 * Maç bittiğinde ham kutu skorundan 4 metrik hesaplar; LLM'e yalnızca bu
 * sonuçlar gider (sayıları model hesaplamaz → halüsinasyon ve token azalır).
 *
 * Bağımlılığı yoktur: tipleri silip `computeNbaMetrics` fonksiyonunu bir
 * n8n "Code" düğümüne aynen yapıştırabilirsiniz.
 */

export type NbaTeamBox = {
  points: number;
  fgm: number;
  fga: number;
  ftm: number;
  fta: number;
  tpm: number;
  tpa: number;
  off_reb: number;
  def_reb: number;
  tot_reb: number;
  assists: number;
  turnovers: number;
  steals: number;
  blocks: number;
  fouls: number;
  // Ücretsiz veri kaynağında boş gelebilir
  points_in_paint: number | null;
  points_off_turnovers: number | null;
  second_chance_points: number | null;
  fast_break_points: number | null;
};

export type NbaPlayerLine = {
  name: string;
  team: 'home' | 'away';
  starter: boolean;
  position: string;
  minutes: number;
  points: number;
  rebounds: number;
  assists: number;
  plus_minus: number;
  fgm: number;
  fga: number;
  tpm: number;
  tpa: number;
  fta: number;
  // Hücum/savunma değerlendirmesi ve faul problemi için (eski kayıtlarda olmayabilir)
  ftm?: number;
  off_reb?: number;
  def_reb?: number;
  steals?: number;
  blocks?: number;
  fouls?: number;
  turnovers?: number;
};

/** Oyuncu etkisi: Hollinger Game Score'un hücum ve savunma bileşenleri */
export type PlayerImpact = {
  name: string;
  team: 'home' | 'away';
  starter: boolean;
  minutes: number;
  score: number;
  line: string; // ekranda ve LLM girdisinde gösterilen kısa özet
};

export type FoulTrouble = {
  name: string;
  team: 'home' | 'away';
  starter: boolean;
  fouls: number;
  fouled_out: boolean; // 6 faul = oyundan atıldı
  minutes: number;
  points: number;
  plus_minus: number;
};

export type NbaMetricsInput = {
  home: NbaTeamBox;
  away: NbaTeamBox;
  /** Çeyrek (ve uzatma) skorları, sırayla */
  periods: { home: number[]; away: number[] };
  players: NbaPlayerLine[];
};

type Side = 'home' | 'away';

export type QuarterSwing = {
  quarter: number; // 1-4, 5+ = uzatma
  label: string; // "3. Çeyrek" / "1. Uzatma"
  home_pts: number;
  away_pts: number;
  swing: number; // ev - deplasman (o periyot)
  score_after: string; // periyot sonu toplam skor, "78-71"
  leader_after: Side | 'tie';
};

export type NbaMetrics = {
  ts: { home: number; away: number; diff: number }; // yüzde, 1 ondalık
  shooting: Record<Side, { fg_pct: number; tp_pct: number; fga: number; tpa: number; three_rate: number }>;
  /** Çok şut/üçlük deneyip düşük TS% ile kaybeden takım ("verimsiz hacim tuzağı") */
  volume_trap: { team: Side; extra_fga: number; extra_tpa: number; ts_gap: number } | null;
  quarters: QuarterSwing[];
  decisive: {
    quarter: number;
    label: string;
    team: Side;
    margin: number; // o periyotta kazanılan fark (pozitif)
    kind: 'break' | 'comeback' | 'hold';
    text: string; // "3. Çeyrekte +16 sayılık seri (Houston Rockets)"
  } | null;
  possession: {
    off_reb: Record<Side, number>;
    turnovers: Record<Side, number>;
    /** Pozitif = ev sahibi lehine fark */
    extra_possessions_home: number; // (ORB_ev - ORB_dep) + (TO_dep - TO_ev)
    points_in_paint: Record<Side, number> | null;
    points_off_turnovers: Record<Side, number> | null;
    second_chance_points: Record<Side, number> | null;
  };
  bench: Record<Side, { starters_pm_avg: number; bench_pm_avg: number; starters_points: number; bench_points: number }> & {
    bench_points_diff_home: number;
  };
  late_game: { q4_home: number | null; q4_away: number | null; final_margin: number; close_game: boolean };
  winner: Side | 'tie';
  /** Oyuncu verisinde gerekli alanlar yoksa (eski kayıt) null */
  player_impact: {
    offense: PlayerImpact[]; // en etkili 3 hücum oyuncusu (iki takım)
    defense: PlayerImpact[]; // en etkili 3 savunma oyuncusu
    foul_trouble: FoulTrouble[]; // 5+ faul
  } | null;
};

/** Game Score hücum bileşeni: PTS + 0.4·FGM − 0.7·FGA − 0.4·(FTA−FTM) + 0.7·ORB + 0.7·AST − TOV */
export const offensiveScore = (p: NbaPlayerLine) =>
  r1(p.points + 0.4 * p.fgm - 0.7 * p.fga - 0.4 * (p.fta - (p.ftm ?? 0)) + 0.7 * (p.off_reb ?? 0) + 0.7 * p.assists - (p.turnovers ?? 0));

/** Game Score savunma bileşeni: 0.3·DRB + STL + 0.7·BLK − 0.4·PF */
export const defensiveScore = (p: NbaPlayerLine) =>
  r1(0.3 * (p.def_reb ?? 0) + (p.steals ?? 0) + 0.7 * (p.blocks ?? 0) - 0.4 * (p.fouls ?? 0));

function playerImpact(players: NbaPlayerLine[]): NbaMetrics['player_impact'] {
  const ps = players.filter((p) => p.minutes > 0);
  // Eski kayıtlarda savunma alanları yok: değerlendirme yapılmaz
  if (!ps.length || ps.every((p) => p.steals === undefined && p.fouls === undefined)) return null;
  const base = (p: NbaPlayerLine) => ({ name: p.name, team: p.team, starter: p.starter, minutes: p.minutes });
  const offense = ps
    .map((p) => ({
      ...base(p),
      score: offensiveScore(p),
      line: `${p.points} sy, ${p.assists} ast, ${p.turnovers ?? 0} TO, ${p.fgm}/${p.fga} FG`,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  const defense = ps
    .map((p) => ({
      ...base(p),
      score: defensiveScore(p),
      line: `${p.steals ?? 0} çalma, ${p.blocks ?? 0} blok, ${p.def_reb ?? 0} sav. rib, ${p.fouls ?? 0} faul`,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  const foul_trouble = ps
    .filter((p) => (p.fouls ?? 0) >= 5)
    .sort((a, b) => (b.fouls ?? 0) - (a.fouls ?? 0))
    .map((p) => ({
      name: p.name,
      team: p.team,
      starter: p.starter,
      fouls: p.fouls ?? 0,
      fouled_out: (p.fouls ?? 0) >= 6,
      minutes: p.minutes,
      points: p.points,
      plus_minus: p.plus_minus,
    }));
  return { offense, defense, foul_trouble };
}

const r1 = (n: number) => Math.round(n * 10) / 10;
const pct = (made: number, att: number) => (att > 0 ? r1((made / att) * 100) : 0);

/** True Shooting %: PTS / (2 * (FGA + 0.44 * FTA)) */
export function trueShooting(t: Pick<NbaTeamBox, 'points' | 'fga' | 'fta'>): number {
  const denom = 2 * (t.fga + 0.44 * t.fta);
  return denom > 0 ? r1((t.points / denom) * 100) : 0;
}

const periodLabel = (i: number) => (i < 4 ? `${i + 1}. Çeyrek` : `${i - 3}. Uzatma`);

export function computeNbaMetrics(input: NbaMetricsInput, names: Record<Side, string>): NbaMetrics {
  const { home: h, away: a } = input;
  const winner: Side | 'tie' = h.points > a.points ? 'home' : a.points > h.points ? 'away' : 'tie';

  // 1) TS% ve şut profili
  const ts = { home: trueShooting(h), away: trueShooting(a), diff: 0 };
  ts.diff = r1(ts.home - ts.away);
  const shoot = (t: NbaTeamBox) => ({
    fg_pct: pct(t.fgm, t.fga),
    tp_pct: pct(t.tpm, t.tpa),
    fga: t.fga,
    tpa: t.tpa,
    three_rate: pct(t.tpa, t.fga), // şutların yüzde kaçı üçlük
  });
  const shooting = { home: shoot(h), away: shoot(a) };

  let volume_trap: NbaMetrics['volume_trap'] = null;
  if (winner !== 'tie') {
    const loser: Side = winner === 'home' ? 'away' : 'home';
    const L = input[loser];
    const W = input[winner];
    const tsGap = r1(ts[winner] - ts[loser]);
    // Kaybeden taraf daha çok şut VEYA daha çok üçlük denedi, ama verimde geride kaldı
    if (tsGap > 0 && (L.fga > W.fga || L.tpa > W.tpa)) {
      volume_trap = { team: loser, extra_fga: L.fga - W.fga, extra_tpa: L.tpa - W.tpa, ts_gap: tsGap };
    }
  }

  // 2) Çeyrek bazlı momentum kırılması
  const n = Math.min(input.periods.home.length, input.periods.away.length);
  const quarters: QuarterSwing[] = [];
  let ch = 0;
  let ca = 0;
  for (let i = 0; i < n; i++) {
    const hp = input.periods.home[i] ?? 0;
    const ap = input.periods.away[i] ?? 0;
    ch += hp;
    ca += ap;
    quarters.push({
      quarter: i + 1,
      label: periodLabel(i),
      home_pts: hp,
      away_pts: ap,
      swing: hp - ap,
      score_after: `${ch}-${ca}`,
      leader_after: ch > ca ? 'home' : ca > ch ? 'away' : 'tie',
    });
  }

  let decisive: NbaMetrics['decisive'] = null;
  if (quarters.length && winner !== 'tie') {
    const sign = winner === 'home' ? 1 : -1;
    // Kazananın geride olduğu son periyot sonu → geri dönüş hikâyesi
    const lastTrailing = quarters.reduce((idx, q, i) => (q.leader_after !== winner && q.leader_after !== 'tie' ? i : idx), -1);
    const candidates = quarters.slice(lastTrailing + 1).filter((q) => q.swing * sign > 0);
    const pool = candidates.length ? candidates : quarters;
    const best = pool.reduce((m, q) => (q.swing * sign > m.swing * sign ? q : m), pool[0]);
    const margin = Math.abs(best.swing);
    const kind: 'break' | 'comeback' | 'hold' = lastTrailing >= 0 ? 'comeback' : margin >= 8 ? 'break' : 'hold';
    const team = best.swing >= 0 ? 'home' : 'away';
    const verb = kind === 'comeback' ? 'geri dönüşü başlatan' : kind === 'break' ? 'maçı koparan' : 'farkı koruyan';
    decisive = {
      quarter: best.quarter,
      label: best.label,
      team,
      margin,
      kind,
      // Türkçe bulunma eki: "Çeyrek" → "Çeyrekte", "Uzatma" → "Uzatmada"
      text: `${best.label}${best.quarter <= 4 ? 'te' : 'da'} +${margin} sayılık seri (${names[team]}): ${verb} periyot`,
    };
  }

  // 3) İkinci şans ve top kaybı cezası
  const both = (k: keyof NbaTeamBox) =>
    h[k] == null || a[k] == null ? null : { home: h[k] as number, away: a[k] as number };
  const possession = {
    off_reb: { home: h.off_reb, away: a.off_reb },
    turnovers: { home: h.turnovers, away: a.turnovers },
    extra_possessions_home: h.off_reb - a.off_reb + (a.turnovers - h.turnovers),
    points_in_paint: both('points_in_paint'),
    points_off_turnovers: both('points_off_turnovers'),
    second_chance_points: both('second_chance_points'),
  };

  // 4) İlk 5 vs yedek kulübesi +/- deltası
  const benchFor = (side: Side) => {
    const ps = input.players.filter((p) => p.team === side && p.minutes > 0);
    const st = ps.filter((p) => p.starter);
    const bn = ps.filter((p) => !p.starter);
    const avg = (xs: NbaPlayerLine[]) => (xs.length ? r1(xs.reduce((s, p) => s + p.plus_minus, 0) / xs.length) : 0);
    const sum = (xs: NbaPlayerLine[]) => xs.reduce((s, p) => s + p.points, 0);
    return { starters_pm_avg: avg(st), bench_pm_avg: avg(bn), starters_points: sum(st), bench_points: sum(bn) };
  };
  const bh = benchFor('home');
  const ba = benchFor('away');

  const q4 = quarters[3];
  const finalMargin = Math.abs(h.points - a.points);

  return {
    ts,
    shooting,
    volume_trap,
    quarters,
    decisive,
    possession,
    bench: { home: bh, away: ba, bench_points_diff_home: bh.bench_points - ba.bench_points },
    late_game: {
      q4_home: q4?.home_pts ?? null,
      q4_away: q4?.away_pts ?? null,
      final_margin: finalMargin,
      close_game: finalMargin <= 5 || quarters.length > 4,
    },
    winner,
    player_impact: playerImpact(input.players),
  };
}
