import type { MatchEvent, MatchRow, ShotQualityVerdict, TacticalPayload, TopPlayer } from './types.ts';

/*
 * TOKEN STRATEJİSİ
 * 1. Sayısal her şeyi kod hesaplar (xG/şut, skor durumu, oyuncu puanı, istatistik kutuları) → 0 token.
 * 2. LLM'e ham JSON yerine ~250-400 tokenlık sıkıştırılmış satırlar gider.
 * 3. LLM yalnızca yorum metni yazar; çıktı kısa anahtarlı sabit bir JSON şemasıdır.
 * 4. Thinking "minimal", max_output_tokens sınırlı, store:false.
 */

// ─────────────────────────────────────────────── girdi sıkıştırma

const EV: Partial<Record<MatchEvent['type'], string>> = {
  goal: 'GOL',
  penalty_goal: 'PEN-GOL',
  own_goal: 'KK-GOL',
  red_card: 'KIRMIZI',
  substitution: 'DEĞ',
  var: 'VAR',
};

const sideTag = (t: 'home' | 'away') => (t === 'home' ? 'E' : 'D');
const sortEvents = (ev: MatchEvent[]) =>
  [...ev].sort((a, b) => a.minute - b.minute || (a.extra ?? 0) - (b.extra ?? 0));

/** Verilen dakikadaki skor (o dakikadaki goller dahil) */
export function scoreAt(events: MatchEvent[], minute: number): string {
  let h = 0;
  let a = 0;
  for (const e of events) {
    if (e.minute > minute) break;
    if (e.type === 'goal' || e.type === 'penalty_goal') e.team === 'home' ? h++ : a++;
    // Varsayım: KK golünde team = topu kendi kalesine atan oyuncunun takımı. Canlı veriyle doğrulayın.
    else if (e.type === 'own_goal') e.team === 'home' ? a++ : h++;
  }
  return `${h}-${a}`;
}

export function buildCompactInput(m: MatchRow): string {
  const s = m.stats!;
  const events = sortEvents(m.events ?? []);
  const p = (k: keyof typeof s.home, f = (v: number) => String(v)) => `${f(s.home[k])}/${f(s.away[k])}`;

  const lines = [
    `${m.home_team}(E) ${m.home_score}-${m.away_score} ${m.away_team}(D) | ${m.league_name}`,
    `TD: ${m.home_coach ?? '?'} / ${m.away_coach ?? '?'}`,
    `STAT E/D: top% ${p('possession')} xG ${p('xg', (v) => v.toFixed(2))} şut ${p('shots_total')} isabet ${p('shots_on_target')} cs-içi ${p('shots_inside_box')} cs-dışı ${p('shots_outside_box')} pas% ${p('passes_accuracy')} korner ${p('corners')} faul ${p('fouls')}`,
  ];

  // Sarı kartlar elenir: taktik değeri düşük, token maliyeti yüksek
  const evLines = events
    .filter((e) => EV[e.type])
    .map((e) => {
      const min = e.extra ? `${e.minute}+${e.extra}` : `${e.minute}`;
      const extra = e.type === 'goal' && e.detail ? ` as:${e.detail}` : e.type === 'substitution' && e.detail ? `>${e.detail}` : '';
      const sc = e.type.includes('goal') ? ` ${scoreAt(events, e.minute)}` : '';
      return `${min} ${sideTag(e.team)} ${EV[e.type]} ${e.player}${extra}${sc}`;
    });
  if (evLines.length) lines.push(`OLAY: ${evLines.join('; ')}`);

  const tp = m.top_players ?? [];
  if (tp.length) {
    lines.push(
      'OYUNCU(puan g a kp tk dw): ' +
        tp.map((x) => `${sideTag(x.team)} ${x.name} ${x.position} ${x.rating} ${x.goals} ${x.assists} ${x.key_passes} ${x.tackles} ${x.duels_won}`).join('; '),
    );
  }
  return lines.join('\n');
}

// ─────────────────────────────────────────────── LLM çıktı şeması (kısa anahtarlar)

export type LlmOut = {
  h: string; // headline_title
  v: string; // executive verdict
  st: ShotQualityVerdict; // shot verdict type
  sl: string; // shot verdict label
  sc: string; // shot commentary
  ms: { m: number; s: 'E' | 'D' | 'N'; t: string; d: string }[]; // momentum shifts
  te: { k: string; x: number; c: string }; // home manager
  td: { k: string; x: number; c: string }; // away manager
  y: { n: string; l: string }; // star player name + one-liner
};

const mgr = {
  type: 'object',
  properties: {
    k: { type: 'string', description: 'kilit hamle, en fazla 8 kelime' },
    x: { type: 'number', minimum: -3, maximum: 3, description: 'etki puanı' },
    c: { type: 'string', description: '1-2 cümle' },
  },
  required: ['k', 'x', 'c'],
};

export const LLM_SCHEMA = {
  type: 'object',
  properties: {
    h: { type: 'string', description: 'çarpıcı başlık, en fazla 8 kelime' },
    v: { type: 'string', description: 'taktik hüküm, 3 cümle' },
    st: { type: 'string', enum: ['sterile_dominance', 'clinical_transition', 'balanced_exchange', 'chance_wastage'] },
    sl: { type: 'string', description: 'şut kalitesi etiketi, en fazla 4 kelime' },
    sc: { type: 'string', description: 'şut kalitesi yorumu, 2 cümle' },
    ms: {
      type: 'array',
      minItems: 2,
      maxItems: 4,
      items: {
        type: 'object',
        properties: {
          m: { type: 'integer', description: 'dakika' },
          s: { type: 'string', enum: ['E', 'D', 'N'], description: 'momentum kimde' },
          t: { type: 'string', description: 'başlık, en fazla 6 kelime' },
          d: { type: 'string', description: '1 cümle' },
        },
        required: ['m', 's', 't', 'd'],
      },
    },
    te: mgr,
    td: mgr,
    y: {
      type: 'object',
      properties: {
        n: { type: 'string', description: 'OYUNCU listesinden birebir isim' },
        l: { type: 'string', description: 'tek cümle' },
      },
      required: ['n', 'l'],
    },
  },
  required: ['h', 'v', 'st', 'sl', 'sc', 'ms', 'te', 'td', 'y'],
};

export const SYSTEM_INSTRUCTION =
  'Futbol taktik analistisin. Türkçe, kısa ve net yaz. YALNIZCA verilen veriye dayan; ' +
  'veride olmayan istatistik, oyuncu veya olay uydurma. E=ev sahibi, D=deplasman, N=nötr. ' +
  'xG ile skor/topla oynama arasındaki çelişkiye ve oyun durumu değişimlerine odaklan.';

// ─────────────────────────────────────────────── birleştirme (0 token)

const round2 = (n: number) => Math.round(n * 100) / 100;
const clampDelta = (x: number) => Math.max(-3, Math.min(3, Math.round(x * 2) / 2));
const momentumSide = (s: 'E' | 'D' | 'N') => (s === 'E' ? 'home' : s === 'D' ? 'away' : 'neutral');

function findStar(name: string, players: TopPlayer[]): TopPlayer | undefined {
  const n = name.trim().toLocaleLowerCase('tr');
  return (
    players.find((p) => p.name.toLocaleLowerCase('tr') === n) ??
    players.find((p) => p.name.toLocaleLowerCase('tr').includes(n) || n.includes(p.name.toLocaleLowerCase('tr'))) ??
    players[0]
  );
}

export function assemblePayload(m: MatchRow, o: LlmOut): TacticalPayload {
  const s = m.stats!;
  const events = sortEvents(m.events ?? []);
  const audit = (t: 'home' | 'away') => ({
    xg: round2(s[t].xg),
    shots: s[t].shots_total,
    xg_per_shot: s[t].shots_total ? round2(s[t].xg / s[t].shots_total) : 0,
    shots_on_target: s[t].shots_on_target,
    shots_inside_box: s[t].shots_inside_box,
  });

  const star = findStar(o.y.n, m.top_players ?? []);
  const starStats = star
    ? [
        { label: 'Gol', value: String(star.goals) },
        { label: 'Asist', value: String(star.assists) },
        { label: 'Kilit pas', value: String(star.key_passes) },
        { label: 'Top kapma', value: String(star.tackles) },
        { label: 'Kazanılan ikili', value: String(star.duels_won) },
      ].filter((k, i) => i < 2 || k.value !== '0')
    : [];

  return {
    headline_title: o.h,
    executive_tactical_verdict: o.v,
    xg_and_shot_quality_audit: {
      verdict_type: o.st,
      verdict_label: o.sl,
      home: audit('home'),
      away: audit('away'),
      commentary: o.sc,
    },
    game_state_and_momentum_shifts: o.ms
      .slice(0, 4)
      .sort((a, b) => a.m - b.m)
      .map((x) => ({
        minute: x.m,
        score_state: scoreAt(events, x.m),
        title: x.t,
        description: x.d,
        momentum: momentumSide(x.s),
      })),
    managerial_and_bench_impact: {
      home: { manager: m.home_coach ?? 'Teknik direktör', delta: clampDelta(o.te.x), key_decision: o.te.k, commentary: o.te.c },
      away: { manager: m.away_coach ?? 'Teknik direktör', delta: clampDelta(o.td.x), key_decision: o.td.k, commentary: o.td.c },
    },
    player_performance_spotlight: {
      player: star?.name ?? o.y.n,
      team: star?.team ?? 'home',
      position: star?.position ?? '—',
      rating: star?.rating ?? 0,
      headline: o.y.l,
      key_stats: starStats,
    },
  };
}
