import type { NbaMetrics, NbaPlayerLine, NbaTeamBox } from './nbaMetrics.ts';

/** matches.stats (NBA): ham kutu skoru + ön-hesaplanmış metrikler */
export type NbaStats = { home: NbaTeamBox; away: NbaTeamBox; metrics: NbaMetrics };

export type NbaMatchRow = {
  fixture_id: number;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  status_short: string;
  stats: NbaStats | null;
  top_players: NbaPlayerLine[] | null;
};

export type NbaEfficiencyVerdict = 'inefficient_volume' | 'efficient_offense' | 'balanced' | 'defensive_grind';

/** tactical_payload (NBA) — headline/verdict/spotlight alanları futbol şemasıyla ortaktır */
export type NbaTacticalPayload = {
  sport: 'nba';
  headline_title: string;
  executive_tactical_verdict: string;
  efficiency_audit: {
    verdict_type: NbaEfficiencyVerdict;
    verdict_label: string;
    home: { ts_pct: number; fg_pct: number; tp_pct: number; fga: number; tpa: number; points: number };
    away: { ts_pct: number; fg_pct: number; tp_pct: number; fga: number; tpa: number; points: number };
    volume_trap_team: 'home' | 'away' | null;
    commentary: string;
  };
  quarter_runs: {
    quarter: number;
    label: string;
    home_pts: number;
    away_pts: number;
    swing: number;
    score_after: string;
    title: string;
    description: string;
    momentum: 'home' | 'away' | 'neutral';
  }[];
  late_game: { close_game: boolean; q4_home: number | null; q4_away: number | null; final_margin: number; commentary: string };
  bench_impact: {
    home: { starters_pm_avg: number; bench_pm_avg: number; bench_points: number; commentary: string };
    away: { starters_pm_avg: number; bench_pm_avg: number; bench_points: number; commentary: string };
  };
  possession_battle: NbaMetrics['possession'];
  player_performance_spotlight: {
    player: string;
    team: 'home' | 'away';
    position: string;
    rating: number; // NBA'de sayı
    headline: string;
    key_stats: { label: string; value: string }[];
  };
};

const tag = (t: 'home' | 'away') => (t === 'home' ? 'E' : 'D');
const sgn = (n: number) => (n > 0 ? `+${n}` : `${n}`);

// ─────────────────────────────────────────────── ücretsiz teaser (0 token)
export function buildNbaTeaser(m: NbaMatchRow): string {
  const score = `${m.home_team} ${m.home_score}-${m.away_score} ${m.away_team}.`;
  const mt = m.stats?.metrics;
  if (!mt) return `${score} Maç sona erdi.`;
  const parts = [score, `TS% ${mt.ts.home}-${mt.ts.away}.`];
  if (mt.decisive) parts.push(`${mt.decisive.text}.`);
  if (mt.volume_trap) {
    const vt = mt.volume_trap;
    const name = vt.team === 'home' ? m.home_team : m.away_team;
    const what = vt.extra_fga > 0 && vt.extra_tpa > 0 ? 'daha fazla şut ve üçlük' : vt.extra_tpa > 0 ? `${vt.extra_tpa} fazla üçlük` : `${vt.extra_fga} fazla şut`;
    parts.push(`${name} ${what} denedi ama TS%'de ${vt.ts_gap} puan geride kaldı.`);
  }
  return parts.join(' ');
}

// ─────────────────────────────────────────────── LLM girdisi (sıkıştırılmış satırlar)
export function buildNbaCompactInput(m: NbaMatchRow): string {
  const s = m.stats!;
  const mt = s.metrics;
  const sh = mt.shooting;
  const lines = [
    `${m.home_team}(E) ${m.home_score}-${m.away_score} ${m.away_team}(D) | NBA`,
    `ŞUT E/D: TS% ${mt.ts.home}/${mt.ts.away} FG% ${sh.home.fg_pct}/${sh.away.fg_pct} 3P% ${sh.home.tp_pct}/${sh.away.tp_pct} FGA ${s.home.fga}/${s.away.fga} 3PA ${s.home.tpa}/${s.away.tpa} FTA ${s.home.fta}/${s.away.fta}`,
    `ÇEYREK(periyot E-D → toplam): ${mt.quarters.map((q) => `${q.label} ${q.home_pts}-${q.away_pts}→${q.score_after}`).join('; ')}`,
    `KIRILMA: ${mt.decisive ? `${mt.decisive.text} [${mt.decisive.kind}]` : 'yok'}`,
    `HACİM TUZAĞI: ${mt.volume_trap ? `${tag(mt.volume_trap.team)} (FGA ${sgn(mt.volume_trap.extra_fga)}, 3PA ${sgn(mt.volume_trap.extra_tpa)}, TS farkı ${mt.volume_trap.ts_gap})` : 'yok'}`,
  ];

  const p = mt.possession;
  const extra = [
    p.points_in_paint ? `boyalı ${p.points_in_paint.home}/${p.points_in_paint.away}` : null,
    p.points_off_turnovers ? `TO'dan sayı ${p.points_off_turnovers.home}/${p.points_off_turnovers.away}` : null,
    p.second_chance_points ? `2.şans ${p.second_chance_points.home}/${p.second_chance_points.away}` : null,
  ].filter(Boolean);
  lines.push(
    `TOP: ORB ${p.off_reb.home}/${p.off_reb.away} TO ${p.turnovers.home}/${p.turnovers.away} ekstra hücum E ${sgn(p.extra_possessions_home)}${extra.length ? ' ' + extra.join(' ') : ''}`,
  );

  const b = mt.bench;
  lines.push(
    `BENCH: ilk5 +/- ort E ${sgn(b.home.starters_pm_avg)} D ${sgn(b.away.starters_pm_avg)}; yedek +/- ort E ${sgn(b.home.bench_pm_avg)} D ${sgn(b.away.bench_pm_avg)}; yedek sayı ${b.home.bench_points}/${b.away.bench_points}`,
  );
  const lg = mt.late_game;
  lines.push(
    `SON ÇEYREK: Q4 ${lg.q4_home ?? '?'}-${lg.q4_away ?? '?'} final fark ${lg.final_margin} yakın maç ${lg.close_game ? 'evet' : 'hayır'} (dakika bazlı clutch verisi YOK)`,
  );

  const tp = m.top_players ?? [];
  if (tp.length) {
    lines.push(
      'OYUNCU(sayı rib ast +/-): ' +
        tp.map((x) => `${tag(x.team)} ${x.name} ${x.points} ${x.rebounds} ${x.assists} ${sgn(x.plus_minus)}`).join('; '),
    );
  }
  return lines.join('\n');
}

// ─────────────────────────────────────────────── çıktı şeması (kısa anahtarlar)
export type NbaLlmOut = {
  h: string;
  v: string;
  et: NbaEfficiencyVerdict;
  el: string;
  ec: string;
  qr: { q: number; s: 'E' | 'D' | 'N'; t: string; d: string }[];
  lg: string;
  bh: string;
  ba: string;
  y: { n: string; l: string };
};

export const NBA_LLM_SCHEMA = {
  type: 'object',
  properties: {
    h: { type: 'string', description: 'çarpıcı başlık, en fazla 8 kelime' },
    v: { type: 'string', description: 'ana maç hükmü, 3 cümle' },
    et: { type: 'string', enum: ['inefficient_volume', 'efficient_offense', 'balanced', 'defensive_grind'] },
    el: { type: 'string', description: 'verimlilik etiketi, en fazla 4 kelime' },
    ec: { type: 'string', description: 'TS% ve hücum verimliliği yorumu, 2 cümle' },
    qr: {
      type: 'array',
      minItems: 1,
      maxItems: 3,
      items: {
        type: 'object',
        properties: {
          q: { type: 'integer', description: 'ÇEYREK satırındaki periyot numarası' },
          s: { type: 'string', enum: ['E', 'D', 'N'] },
          t: { type: 'string', description: 'başlık, en fazla 6 kelime' },
          d: { type: 'string', description: '1 cümle' },
        },
        required: ['q', 's', 't', 'd'],
      },
    },
    lg: { type: 'string', description: 'son çeyrek / maç sonu yorumu, 1-2 cümle' },
    bh: { type: 'string', description: 'ev sahibi ilk 5 vs yedek etkisi, 1 cümle' },
    ba: { type: 'string', description: 'deplasman ilk 5 vs yedek etkisi, 1 cümle' },
    y: {
      type: 'object',
      properties: {
        n: { type: 'string', description: 'OYUNCU listesinden birebir isim' },
        l: { type: 'string', description: 'tek cümle' },
      },
      required: ['n', 'l'],
    },
  },
  required: ['h', 'v', 'et', 'el', 'ec', 'qr', 'lg', 'bh', 'ba', 'y'],
};

export const NBA_SYSTEM_INSTRUCTION =
  'NBA taktik analistisin. Türkçe, kısa ve net yaz. YALNIZCA verilen sayıları kullan; yeni istatistik, ' +
  'oyuncu, olay veya dakika uydurma; sayı hesaplama, verilenleri aynen aktar. E=ev sahibi, D=deplasman, N=nötr. ' +
  'Öncelikler: 1) HACİM TUZAĞI satırı doluysa, çok şut/üçlük deneyip düşük TS% ile kaybeden takımın ' +
  '"verimsiz hacim tuzağına" düştüğünü açıkla (et=inefficient_volume). 2) KIRILMA satırındaki periyodu momentum ' +
  'anlatısının merkezine koy. 3) BENCH satırına göre ilk 5 ile yedeklerin +/- farkını yorumla. ' +
  '4) Dakika bazlı clutch verisi YOKTUR: "son 5 dakika", "clutch şut" gibi iddialarda bulunma; yalnızca son çeyrek ' +
  'skoru ve final farkını yorumla.';

// ─────────────────────────────────────────────── birleştirme (0 token)
const side = (s: 'E' | 'D' | 'N') => (s === 'E' ? 'home' : s === 'D' ? 'away' : 'neutral');

export function assembleNbaPayload(m: NbaMatchRow, o: NbaLlmOut): NbaTacticalPayload {
  const s = m.stats!;
  const mt = s.metrics;
  const eff = (t: 'home' | 'away') => ({
    ts_pct: mt.ts[t],
    fg_pct: mt.shooting[t].fg_pct,
    tp_pct: mt.shooting[t].tp_pct,
    fga: s[t].fga,
    tpa: s[t].tpa,
    points: s[t].points,
  });

  // Periyot sayıları ve skorlar koddan; LLM yalnızca başlık/açıklama verir
  const byQ = new Map(mt.quarters.map((q) => [q.quarter, q]));
  const runs = o.qr
    .filter((x) => byQ.has(x.q))
    .slice(0, 3)
    .sort((a, b) => a.q - b.q)
    .map((x) => {
      const q = byQ.get(x.q)!;
      return {
        quarter: q.quarter,
        label: q.label,
        home_pts: q.home_pts,
        away_pts: q.away_pts,
        swing: q.swing,
        score_after: q.score_after,
        title: x.t,
        description: x.d,
        momentum: side(x.s) as 'home' | 'away' | 'neutral',
      };
    });

  const players = m.top_players ?? [];
  const n = o.y.n.trim().toLocaleLowerCase('tr');
  const star =
    players.find((p) => p.name.toLocaleLowerCase('tr') === n) ??
    players.find((p) => p.name.toLocaleLowerCase('tr').includes(n) || n.includes(p.name.toLocaleLowerCase('tr'))) ??
    players[0];

  return {
    sport: 'nba',
    headline_title: o.h,
    executive_tactical_verdict: o.v,
    efficiency_audit: {
      verdict_type: o.et,
      verdict_label: o.el,
      home: eff('home'),
      away: eff('away'),
      volume_trap_team: mt.volume_trap?.team ?? null,
      commentary: o.ec,
    },
    quarter_runs: runs,
    late_game: { ...mt.late_game, commentary: o.lg },
    bench_impact: {
      home: { starters_pm_avg: mt.bench.home.starters_pm_avg, bench_pm_avg: mt.bench.home.bench_pm_avg, bench_points: mt.bench.home.bench_points, commentary: o.bh },
      away: { starters_pm_avg: mt.bench.away.starters_pm_avg, bench_pm_avg: mt.bench.away.bench_pm_avg, bench_points: mt.bench.away.bench_points, commentary: o.ba },
    },
    possession_battle: mt.possession,
    player_performance_spotlight: {
      player: star?.name ?? o.y.n,
      team: star?.team ?? 'home',
      position: star?.position ?? '—',
      rating: star?.points ?? 0,
      headline: o.y.l,
      key_stats: star
        ? [
            { label: 'Sayı', value: String(star.points) },
            { label: 'Ribaund', value: String(star.rebounds) },
            { label: 'Asist', value: String(star.assists) },
            { label: '+/-', value: sgn(star.plus_minus) },
            { label: 'Saha içi', value: `${star.fgm}/${star.fga}` },
            { label: 'Üçlük', value: `${star.tpm}/${star.tpa}` },
          ]
        : [],
    },
  };
}

/** Spotlight adayları: en etkili 6 oyuncu (sayı + ribaund + asist) */
export function pickTopPlayers(players: NbaPlayerLine[]): NbaPlayerLine[] {
  return [...players]
    .filter((p) => p.minutes > 0)
    .sort((a, b) => b.points + b.rebounds + b.assists - (a.points + a.rebounds + a.assists))
    .slice(0, 6);
}
