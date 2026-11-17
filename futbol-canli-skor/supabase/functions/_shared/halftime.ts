/**
 * CANLI DEVRE ARASI "SOYUNMA ODASI REÇETESİ"
 * ──────────────────────────────────────────
 * İlk yarı verisinden sinyalleri ve push bildirim metnini KOD üretir (0 token).
 * LLM yalnızca ~150 kelimelik "İkinci yarıda ne olmalı?" reçetesini yazar;
 * metindeki her sayı girdiyle doğrulanır, uyuşmazsa deterministik metne düşülür.
 */

type Side = 'home' | 'away';
// deno-lint-ignore no-explicit-any
type Json = any;

export type HalfStats = {
  possession: number | null;
  xg: number | null;
  shots: number;
  on_target: number;
  inside_box: number;
  outside_box: number;
  corners: number;
  fouls: number;
  pass_pct: number | null;
};

export type HalfEvent = { minute: number; side: Side; type: 'goal' | 'red_card' | 'substitution'; player: string; detail?: string | null };

export type HalftimeSignal =
  | { kind: 'red_card'; side: Side; minute: number; player: string }
  | { kind: 'sterile_possession'; side: Side; possession: number; xg: number }
  | { kind: 'xg_score_mismatch'; side: Side; xg: number; opp_xg: number }
  | { kind: 'long_range'; side: Side; outside: number; shots: number };

export type HalftimeFacts = {
  home_team: string;
  away_team: string;
  league: string;
  score: { home: number; away: number };
  formations: Record<Side, string | null>;
  stats: Record<Side, HalfStats>;
  events: HalfEvent[];
  signals: HalftimeSignal[];
};

// ─────────────────────────────────────────────── API → ilk yarı verisi

const val = (list: Json[], name: string): number | null => {
  const v = list?.find((s: Json) => s.type === name)?.value;
  if (v == null) return null;
  const x = typeof v === 'string' ? parseFloat(v.replace('%', '')) : Number(v);
  return Number.isFinite(x) ? x : null;
};

/** /fixtures?id= yanıtı (devre arasında) → ilk yarı olguları */
export function buildHalftimeFacts(f: Json, league: string): HalftimeFacts {
  const homeId = f.teams.home.id;
  const side = (id: number): Side => (id === homeId ? 'home' : 'away');
  const stat = (s: Side): HalfStats => {
    const list = (f.statistics ?? []).find((t: Json) => side(t.team?.id) === s)?.statistics ?? [];
    return {
      possession: val(list, 'Ball Possession'),
      xg: val(list, 'expected_goals'),
      shots: val(list, 'Total Shots') ?? 0,
      on_target: val(list, 'Shots on Goal') ?? 0,
      inside_box: val(list, 'Shots insidebox') ?? 0,
      outside_box: val(list, 'Shots outsidebox') ?? 0,
      corners: val(list, 'Corner Kicks') ?? 0,
      fouls: val(list, 'Fouls') ?? 0,
      pass_pct: val(list, 'Passes %'),
    };
  };
  const events: HalfEvent[] = [];
  for (const e of f.events ?? []) {
    const minute = e.time?.elapsed ?? 0;
    if (minute > 45) continue; // yalnız ilk yarı (uzatma dakikaları elapsed=45 + extra olarak gelir)
    const s = side(e.team?.id);
    if (e.type === 'Goal' && e.detail !== 'Missed Penalty') {
      // Kendi kalesine golde takım = golü yiyen değil atan oyuncunun takımı olabilir; skor zaten API'den gelir
      events.push({ minute, side: s, type: 'goal', player: e.player?.name ?? '—', detail: e.detail === 'Own Goal' ? 'kendi kalesine' : e.assist?.name ?? null });
    } else if (e.type === 'Card' && /^(Red|Second)/.test(e.detail ?? '')) {
      events.push({ minute, side: s, type: 'red_card', player: e.player?.name ?? '—' });
    } else if (e.type === 'subst') {
      events.push({ minute, side: s, type: 'substitution', player: e.assist?.name ?? e.player?.name ?? '—', detail: e.player?.name ?? null });
    }
  }
  const formations: Record<Side, string | null> = { home: null, away: null };
  for (const l of f.lineups ?? []) formations[side(l.team?.id)] = l.formation ?? null;

  const facts: HalftimeFacts = {
    home_team: f.teams.home.name,
    away_team: f.teams.away.name,
    league,
    score: { home: f.goals?.home ?? 0, away: f.goals?.away ?? 0 },
    formations,
    stats: { home: stat('home'), away: stat('away') },
    events,
    signals: [],
  };
  facts.signals = computeSignals(facts);
  return facts;
}

/** Öncelik sırasıyla deterministik ilk yarı sinyalleri */
export function computeSignals(f: HalftimeFacts): HalftimeSignal[] {
  const out: HalftimeSignal[] = [];
  for (const e of f.events) if (e.type === 'red_card') out.push({ kind: 'red_card', side: e.side, minute: e.minute, player: e.player });
  for (const s of ['home', 'away'] as const) {
    const o: Side = s === 'home' ? 'away' : 'home';
    const me = f.stats[s];
    const opp = f.stats[o];
    const myGoals = f.score[s];
    const oppGoals = f.score[o];
    if (me.possession != null && me.xg != null && me.possession >= 60 && me.xg < 0.5 && (opp.xg == null || me.xg <= opp.xg + 0.2)) {
      out.push({ kind: 'sterile_possession', side: s, possession: me.possession, xg: me.xg });
    }
    if (me.xg != null && opp.xg != null && me.xg - opp.xg >= 0.6 && myGoals <= oppGoals) {
      out.push({ kind: 'xg_score_mismatch', side: s, xg: me.xg, opp_xg: opp.xg });
    }
    if (me.shots >= 6 && me.outside_box / me.shots >= 0.6) out.push({ kind: 'long_range', side: s, outside: me.outside_box, shots: me.shots });
  }
  return out;
}

// ─────────────────────────────────────────────── push / ücretsiz teaser (0 token)

const x2 = (v: number) => v.toFixed(2);
const nameOf = (f: HalftimeFacts, s: Side) => (s === 'home' ? f.home_team : f.away_team);

export const HALFTIME_PUSH_TITLE = 'Devre Arası AI Raporu';

/** Bildirim gövdesi ve listede gösterilen ücretsiz tek cümle */
export function buildHalftimeTeaser(f: HalftimeFacts): string {
  const sig = f.signals[0];
  const cta = 'İkinci yarıda kilidi açacak hamle uygulamada!';
  if (sig?.kind === 'red_card') return `${nameOf(f, sig.side)} ilk yarıda ${sig.minute}. dakikada 10 kişi kaldı. ${cta}`;
  if (sig?.kind === 'sterile_possession') return `${nameOf(f, sig.side)} %${sig.possession} topla oynadı ama ${x2(sig.xg)} xG'de kaldı. ${cta}`;
  if (sig?.kind === 'xg_score_mismatch') {
    return `${nameOf(f, sig.side)} ${x2(sig.xg)}-${x2(sig.opp_xg)} xG üstünlüğüne rağmen skorda öne geçemedi. ${cta}`;
  }
  const { home: h, away: a } = f.stats;
  const xg = h.xg != null && a.xg != null ? `, xG ${x2(h.xg)}-${x2(a.xg)}` : `, şut ${h.shots}-${a.shots}`;
  return `İlk yarı: ${f.home_team} ${f.score.home}-${f.score.away} ${f.away_team}${xg}. ${cta}`;
}

// ─────────────────────────────────────────────── LLM girdisi

const tag = (s: Side) => (s === 'home' ? 'E' : 'D');
const n = (v: number | null) => (v == null ? '?' : String(v));

export function buildHalftimeInput(f: HalftimeFacts): string {
  const h = f.stats.home;
  const a = f.stats.away;
  const lines = [
    `İLK YARI: ${f.home_team}(E) ${f.score.home}-${f.score.away} ${f.away_team}(D) | ${f.league}`,
    `DİZİLİŞ: E ${f.formations.home ?? '?'} | D ${f.formations.away ?? '?'}`,
    `STAT E/D: top% ${n(h.possession)}/${n(a.possession)} xG ${n(h.xg)}/${n(a.xg)} şut ${h.shots}/${a.shots} isabet ${h.on_target}/${a.on_target} cs-içi ${h.inside_box}/${a.inside_box} cs-dışı ${h.outside_box}/${a.outside_box} korner ${h.corners}/${a.corners} faul ${h.fouls}/${a.fouls} pas% ${n(h.pass_pct)}/${n(a.pass_pct)}`,
  ];
  if (f.events.length) {
    lines.push(
      'OLAY: ' +
        f.events
          .map((e) => `${e.minute} ${tag(e.side)} ${e.type === 'goal' ? 'GOL' : e.type === 'red_card' ? 'KIRMIZI' : 'DEĞ'} ${e.player}${e.detail ? ` (${e.detail})` : ''}`)
          .join('; '),
    );
  }
  const sig = f.signals.map((s) => {
    switch (s.kind) {
      case 'red_card':
        return `${tag(s.side)} 10 kişi (${s.minute}. dk)`;
      case 'sterile_possession':
        return `${tag(s.side)} kısır top hakimiyeti (top %${s.possession}, xG ${s.xg})`;
      case 'xg_score_mismatch':
        return `${tag(s.side)} xG üstün ama skorda değil (${s.xg} vs ${s.opp_xg})`;
      case 'long_range':
        return `${tag(s.side)} uzaktan şut ağırlıklı (${s.outside}/${s.shots})`;
    }
  });
  lines.push(`SİNYAL: ${sig.length ? sig.join('; ') : 'belirgin sinyal yok'}`);
  return lines.join('\n');
}

// ─────────────────────────────────────────────── şema ve talimat

export type HalftimeLlmOut = {
  h: string;
  d: string;
  rx: { t: 'E' | 'D'; m: string; w: string }[];
  k: string;
};

export const HALFTIME_SCHEMA = {
  type: 'object',
  properties: {
    h: { type: 'string', description: 'başlık, en fazla 7 kelime' },
    d: { type: 'string', description: 'ilk yarının durum tespiti, 2 cümle' },
    rx: {
      type: 'array',
      minItems: 2,
      maxItems: 4,
      items: {
        type: 'object',
        properties: {
          t: { type: 'string', enum: ['E', 'D'] },
          m: { type: 'string', description: 'ikinci yarı hamlesi, en fazla 12 kelime' },
          w: { type: 'string', description: 'gerekçe, 1 kısa cümle' },
        },
        required: ['t', 'm', 'w'],
      },
    },
    k: { type: 'string', description: 'ikinci yarının kilidi, 1 cümle' },
  },
  required: ['h', 'd', 'rx', 'k'],
};

export const HALFTIME_SYSTEM_INSTRUCTION =
  'Futbol devre arası analistisin; soyunma odası reçetesi yazıyorsun. Türkçe, toplam en fazla 150 kelime. ' +
  'YALNIZCA verilen satırlardaki sayıları ve isimleri kullan; yeni istatistik, oyuncu veya olay uydurma, sayı hesaplama. ' +
  'E=ev sahibi, D=deplasman. Her iki takım için en az bir somut ikinci yarı hamlesi ver (ör. diziliş, ' +
  'bölge, tempo, şut seçimi); SİNYAL satırını önceliklendir. Hamle (m) metninde sayı kullanma; gerekçede (w) ' +
  'yalnız satırdaki yüzde ve xG değerlerini aynen kullan. Kesin skor tahmini yapma.';

// ─────────────────────────────────────────────── doğrulama ve payload

const numbersIn = (text: string) => (text.match(/\d+(?:[.,]\d+)?/g) ?? []).map((s) => Number(s.replace(',', '.')));
const okNumbers = (text: string, allowed: Set<number>) => numbersIn(text).every((x) => allowed.has(x));

/**
 * Reçete maddeleri için sıkı kural: küçük tam sayılar girdide tesadüfen bulunabildiğinden
 * (skor 3, faul 12 …) genel kontrol uydurmayı yakalayamaz (gerçek test vakası).
 *   hamle (m)  : hiç sayı içeremez
 *   gerekçe (w): yalnız girdide geçen yüzde (%65) ve ondalıklı değer (0.18) içerebilir
 */
function okPrescription(move: string, why: string, allowed: Set<number>): boolean {
  if (/\d/.test(move)) return false;
  const tokens = why.match(/%?\d+(?:[.,]\d+)?/g) ?? [];
  return tokens.every((t) => {
    const isPct = t.startsWith('%');
    const isDec = /[.,]/.test(t);
    return (isPct || isDec) && allowed.has(Number(t.replace('%', '').replace(',', '.')));
  });
}

export type HalftimePayload = {
  kind: 'halftime';
  headline: string;
  situation: string;
  prescriptions: { side: Side; move: string; why: string }[];
  key: string;
  score: { home: number; away: number };
  formations: Record<Side, string | null>;
  first_half: Record<Side, HalfStats>;
  events: HalfEvent[];
  signals: HalftimeSignal[];
  teaser: string;
  generated_at: string;
};

export function assembleHalftime(f: HalftimeFacts, input: string, o: HalftimeLlmOut): HalftimePayload {
  const allowed = new Set(numbersIn(input));
  const teaser = buildHalftimeTeaser(f);
  const pick = (text: string, fallback: string, label: string) => {
    if (text?.trim() && okNumbers(text, allowed)) return text;
    if (text?.trim()) console.warn(`[halftime] ${label} veriyle uyuşmadı, şablona düşüldü:`, text);
    return fallback;
  };
  const prescriptions = (o.rx ?? [])
    .filter((r) => (r.t === 'E' || r.t === 'D') && r.m?.trim() && okPrescription(r.m, r.w ?? '', allowed))
    .slice(0, 4)
    .map((r) => ({ side: (r.t === 'E' ? 'home' : 'away') as Side, move: r.m, why: r.w ?? '' }));

  return {
    kind: 'halftime',
    headline: o.h?.trim() && okNumbers(o.h, allowed) ? o.h : 'İkinci Yarı Reçetesi',
    situation: pick(o.d, teaser.replace(/ İkinci yarıda.*$/, ''), 'durum tespiti'),
    prescriptions,
    key: pick(o.k, '', 'ikinci yarının kilidi'),
    score: f.score,
    formations: f.formations,
    first_half: f.stats,
    events: f.events,
    signals: f.signals,
    teaser,
    generated_at: new Date().toISOString(),
  };
}
