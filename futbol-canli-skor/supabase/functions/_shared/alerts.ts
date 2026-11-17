/**
 * AKILLI ALARM — "gürültüsüz bildirim"
 * ─────────────────────────────────────
 * Her korner/faulde değil, yalnız veriyle anlamlı anlarda alarm üretilir.
 * Tespit tamamen kodla (0 token) dakikalık anlık görüntüler üzerinden yapılır.
 * Yalnız kırmızı kart alarmında Gemini kısa bir canlı taktik analiz yazar.
 */
import type { MatchEvent, MatchStats } from './types.ts';
import { numbersIn, okNumbers, okPrescription } from './halftime.ts';

type Side = 'home' | 'away';
const other = (s: Side): Side => (s === 'home' ? 'away' : 'home');

export type AlertKind = 'pressure' | 'nba_run' | 'red_card';

export type AlertDraft = {
  fixture_id: number;
  kind: AlertKind;
  side: Side;
  minute: number | null;
  title: string;
  body: string;
  dedupe_key: string;
};

/** match_snapshots satırı */
export type Snapshot = {
  fixture_id: number;
  taken_at: string;
  minute: number | null;
  home_score: number | null;
  away_score: number | null;
  data?: { sot?: Record<Side, number>; xg?: Record<Side, number> } | null;
};

export const ALERT_TITLES: Record<AlertKind, string> = {
  pressure: '🚨 Baskı Alarmı',
  nba_run: '🔥 NBA Seri Alarmı',
  red_card: '⚡ Kırmızı Kart Kırılması',
};

// ─────────────────────────────────────────────── eşikler

/** Baskı: pencere içinde en az bu kadar isabetli şut VE bu kadar xG, gol yok */
export const PRESSURE = { windowMin: 10, minWindowMin: 7, maxWindowMin: 13, sot: 3, xg: 0.8, cooldownMin: 15 };
/** NBA serisi: rakip sayı bulamadan en az bu kadar sayı */
export const NBA_RUN_MIN = 12;
/** Kırmızı kart ancak bu kadar dakika içinde görüldüyse alarm (eski kartlar için bildirim gitmez) */
export const RED_CARD_FRESH_MIN = 10;

export function footballSnapshot(fixtureId: number, minute: number | null, hs: number | null, as: number | null, stats: MatchStats | null): Snapshot {
  return {
    fixture_id: fixtureId,
    taken_at: new Date().toISOString(),
    minute,
    home_score: hs,
    away_score: as,
    data: stats
      ? {
          sot: { home: stats.home.shots_on_target, away: stats.away.shots_on_target },
          xg: { home: stats.home.xg, away: stats.away.xg },
        }
      : null,
  };
}

// ─────────────────────────────────────────────── futbol: baskı alarmı

export type PressureHit = { side: Side; shots: number; xg: number; window: number };

/**
 * Şimdiki görüntüyü ~10 dk önceki görüntüyle karşılaştırır.
 * history: aynı maçın önceki görüntüleri (herhangi bir sırada).
 */
export function detectPressure(cur: Snapshot, history: Snapshot[]): PressureHit[] {
  if (cur.minute == null || !cur.data?.sot || !cur.data?.xg) return [];
  // Pencere başı: dakikası (şimdi − 7..13) aralığında olan, 10 dk'ya en yakın görüntü
  const candidates = history.filter(
    (s) => s.minute != null && s.data?.sot && s.data?.xg &&
      cur.minute! - s.minute >= PRESSURE.minWindowMin && cur.minute! - s.minute <= PRESSURE.maxWindowMin,
  );
  if (!candidates.length) return [];
  const base = candidates.reduce((a, b) =>
    Math.abs(cur.minute! - a.minute! - PRESSURE.windowMin) <= Math.abs(cur.minute! - b.minute! - PRESSURE.windowMin) ? a : b,
  );
  const out: PressureHit[] = [];
  for (const s of ['home', 'away'] as const) {
    const shots = cur.data.sot[s] - base.data!.sot![s];
    const xg = Math.round((cur.data.xg[s] - base.data!.xg![s]) * 100) / 100;
    const goals = (s === 'home' ? cur.home_score : cur.away_score) ?? 0;
    const goalsBefore = (s === 'home' ? base.home_score : base.away_score) ?? 0;
    // "Gol kapıda": baskı var ama henüz gol olmadı
    if (shots >= PRESSURE.sot && xg >= PRESSURE.xg && goals === goalsBefore) {
      out.push({ side: s, shots, xg, window: cur.minute - base.minute! });
    }
  }
  return out;
}

export function pressureAlert(fixtureId: number, minute: number, hit: PressureHit, team: string): AlertDraft {
  return {
    fixture_id: fixtureId,
    kind: 'pressure',
    side: hit.side,
    minute,
    title: ALERT_TITLES.pressure,
    body: `Son ${hit.window} dakikada ${team} ${hit.shots} isabetli şut (${hit.xg.toFixed(2)} xG) buldu, gol kapıda!`,
    // Bekleme süresi ayrıca veritabanından kontrol edilir; anahtar aynı dakikada ikinci kaydı engeller
    dedupe_key: `pressure:${fixtureId}:${hit.side}:${minute}`,
  };
}

// ─────────────────────────────────────────────── futbol: kırmızı kart

export function redCardAlerts(fixtureId: number, minute: number | null, events: MatchEvent[] | null, names: Record<Side, string>): AlertDraft[] {
  if (minute == null || !events) return [];
  return events
    .filter((e) => e.type === 'red_card' && minute - e.minute <= RED_CARD_FRESH_MIN)
    .map((e) => ({
      fixture_id: fixtureId,
      kind: 'red_card' as const,
      side: e.team,
      minute: e.minute,
      title: ALERT_TITLES.red_card,
      body: `${e.minute}' ${e.player} (${names[e.team]}) kırmızı kart gördü, ${names[e.team]} 10 kişi kaldı. Maçta dengeler değişti.`,
      dedupe_key: `red:${fixtureId}:${e.team}:${e.minute}:${e.player}`,
    }));
}

/** Analiz hazır olunca push metnine eklenen kuyruk */
export const RED_CARD_ANALYSIS_SUFFIX = ' Canlı taktik analiz güncellendi.';

// ─────────────────────────────────────────────── NBA: seri alarmı

export type NbaRun = { side: Side; points: number; startAt: string; period: number | null; marginBefore: number; marginAfter: number };

/**
 * Son görüntüden geriye doğru: rakibin skoru değişmeden geçen en uzun aralık.
 * Görüntüler dakikalık olduğundan seri en az bu kadardır (alt sınır).
 */
export function detectNbaRun(snaps: Snapshot[]): NbaRun | null {
  const list = snaps
    .filter((s) => s.home_score != null && s.away_score != null)
    .sort((a, b) => a.taken_at.localeCompare(b.taken_at));
  if (list.length < 2) return null;
  const cur = list[list.length - 1];
  for (const s of ['home', 'away'] as const) {
    const o = other(s);
    const oppNow = o === 'home' ? cur.home_score! : cur.away_score!;
    let start = cur;
    for (let i = list.length - 2; i >= 0; i--) {
      const oppThen = o === 'home' ? list[i].home_score! : list[i].away_score!;
      if (oppThen !== oppNow) break;
      start = list[i];
    }
    const pts = (s === 'home' ? cur.home_score! - start.home_score! : cur.away_score! - start.away_score!);
    if (pts >= NBA_RUN_MIN) {
      const margin = (x: Snapshot) => (s === 'home' ? x.home_score! - x.away_score! : x.away_score! - x.home_score!);
      return { side: s, points: pts, startAt: start.taken_at, period: cur.minute, marginBefore: margin(start), marginAfter: margin(cur) };
    }
  }
  return null;
}

export function nbaRunAlert(fixtureId: number, run: NbaRun, team: string): AlertDraft {
  const q = run.period && run.period <= 4 ? `${run.period}. çeyrekte` : run.period ? 'uzatmada' : '';
  let tail: string;
  if (run.marginBefore < 0 && run.marginAfter < 0) tail = `fark ${-run.marginAfter} sayıya indi!`;
  else if (run.marginBefore < 0 && run.marginAfter === 0) tail = 'skor eşitlendi!';
  else if (run.marginBefore <= 0 && run.marginAfter > 0) tail = `${team} öne geçti!`;
  else tail = `fark ${run.marginAfter} sayıya çıktı!`;
  return {
    fixture_id: fixtureId,
    kind: 'nba_run',
    side: run.side,
    minute: run.period,
    title: ALERT_TITLES.nba_run,
    body: `${q ? q + ' ' : ''}${team} ${run.points}-0'lık seri yakaladı, ${tail}`,
    // Aynı seri büyüse de (14-0 → 18-0) tek alarm: anahtar serinin başlangıcı
    dedupe_key: `run:${fixtureId}:${run.side}:${run.startAt}`,
  };
}

// ─────────────────────────────────────────────── kırmızı kart: canlı taktik analiz (Gemini)

export type RedCardFacts = {
  home_team: string;
  away_team: string;
  minute: number;
  score: { home: number; away: number };
  red: { side: Side; player: string; minute: number };
  stats: MatchStats | null;
  events: MatchEvent[];
};

const tag = (s: Side) => (s === 'home' ? 'E' : 'D');

export function buildRedCardInput(f: RedCardFacts): string {
  const lines = [
    `MAÇ: ${f.home_team}(E) ${f.score.home}-${f.score.away} ${f.away_team}(D) | dakika ${f.minute}`,
    `KIRMIZI: ${tag(f.red.side)} ${f.red.player} ${f.red.minute}. dk → ${tag(f.red.side)} 10 kişi`,
  ];
  if (f.stats) {
    const h = f.stats.home;
    const a = f.stats.away;
    lines.push(
      `STAT E/D: top% ${h.possession}/${a.possession} xG ${h.xg}/${a.xg} şut ${h.shots_total}/${a.shots_total} isabet ${h.shots_on_target}/${a.shots_on_target} korner ${h.corners}/${a.corners} faul ${h.fouls}/${a.fouls}`,
    );
  }
  const ev = f.events.filter((e) => ['goal', 'own_goal', 'penalty_goal', 'red_card'].includes(e.type));
  if (ev.length) lines.push('OLAY: ' + ev.map((e) => `${e.minute} ${tag(e.team)} ${e.type === 'red_card' ? 'KIRMIZI' : 'GOL'} ${e.player}`).join('; '));
  return lines.join('\n');
}

export type RedCardLlmOut = { h: string; d: string; rx: { t: 'E' | 'D'; m: string; w: string }[]; k: string };

export const RED_CARD_SCHEMA = {
  type: 'object',
  properties: {
    h: { type: 'string', description: 'başlık, en fazla 7 kelime' },
    d: { type: 'string', description: 'kırmızı kart sonrası yeni denge, 2 cümle' },
    rx: {
      type: 'array',
      minItems: 2,
      maxItems: 3,
      items: {
        type: 'object',
        properties: {
          t: { type: 'string', enum: ['E', 'D'] },
          m: { type: 'string', description: 'hamle, en fazla 12 kelime' },
          w: { type: 'string', description: 'gerekçe, 1 kısa cümle' },
        },
        required: ['t', 'm', 'w'],
      },
    },
    k: { type: 'string', description: 'kalan sürenin kilidi, 1 cümle' },
  },
  required: ['h', 'd', 'rx', 'k'],
};

export const RED_CARD_SYSTEM_INSTRUCTION =
  'Canlı futbol taktik analistisin; az önce kırmızı kart çıktı. Türkçe, toplam en fazla 110 kelime. ' +
  'YALNIZCA verilen satırlardaki sayıları ve isimleri kullan; yeni istatistik, oyuncu veya olay uydurma, sayı hesaplama. ' +
  'E=ev sahibi, D=deplasman. 10 kişi kalan takım ve 11 kişilik takım için birer somut hamle ver (diziliş, blok, ' +
  'kanat, tempo). Hamle (m) metninde sayı kullanma; gerekçede (w) yalnız satırdaki yüzde ve xG değerlerini aynen kullan. ' +
  'Kesin skor tahmini yapma.';

export type RedCardAnalysis = {
  kind: 'red_card';
  headline: string;
  situation: string;
  prescriptions: { side: Side; move: string; why: string }[];
  key: string;
  red: RedCardFacts['red'];
  minute: number;
  score: RedCardFacts['score'];
  generated_at: string;
};

export function assembleRedCard(f: RedCardFacts, input: string, o: RedCardLlmOut): RedCardAnalysis {
  const allowed = new Set(numbersIn(input));
  const team = f.red.side === 'home' ? f.home_team : f.away_team;
  const ok = (t: string | undefined) => !!t?.trim() && okNumbers(t, allowed);
  return {
    kind: 'red_card',
    headline: ok(o.h) ? o.h : `${team} 10 Kişi: Yeni Denge`,
    situation: ok(o.d) ? o.d : `${f.red.player} kırmızı kart gördü; ${team} kalan sürede bir kişi eksik oynayacak.`,
    prescriptions: (o.rx ?? [])
      .filter((r) => (r.t === 'E' || r.t === 'D') && r.m?.trim() && okPrescription(r.m, r.w ?? '', allowed))
      .slice(0, 3)
      .map((r) => ({ side: (r.t === 'E' ? 'home' : 'away') as Side, move: r.m, why: r.w ?? '' })),
    key: ok(o.k) ? o.k : '',
    red: f.red,
    minute: f.minute,
    score: f.score,
    generated_at: new Date().toISOString(),
  };
}
