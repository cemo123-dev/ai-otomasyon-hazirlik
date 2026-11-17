import type { NbaPlayerLine, NbaTeamBox } from './nbaMetrics.ts';
import { normalizeNbaLogo } from './nbaBox.ts';

/**
 * API-NBA (api-sports.io, API-Football ile aynı anahtar).
 * Not: NBA'in kendi CDN'i (cdn.nba.com) sunuculardan gelen istekleri bot korumasıyla
 * engelliyor; bu yüzden lisanslı ve anahtarlı bu kaynak kullanılır.
 * Ücretsiz plan: günde 100, dakikada 10 istek.
 */
const BASE = 'https://v2.nba.api-sports.io';

/** NBA maçlarının fixture_id'si futbol id'leriyle çakışmasın diye kaydırılır */
export const NBA_ID_OFFSET = 9_000_000_000;
export const toFixtureId = (gameId: number) => NBA_ID_OFFSET + gameId;
export const toGameId = (fixtureId: number) => fixtureId - NBA_ID_OFFSET;

const PAID = Deno.env.get('API_FOOTBALL_PAID') === '1';
const MIN_GAP_MS = PAID ? 0 : 6500;
let lastCallAt = 0;

// deno-lint-ignore no-explicit-any
type Json = any;

/**
 * KOTA BEKÇİSİ — API-NBA, API-Football ile aynı günlük kotayı paylaşır.
 * İsteğe bağlı çekimler (kutu skoru) kalan kota NBA_QUOTA_RESERVE'in altına inecekse atlanır.
 */
const QUOTA_RESERVE = Number(Deno.env.get('NBA_QUOTA_RESERVE') ?? 5);
let quotaRemaining: number | null = null;
export const hasNbaQuota = (needed = 1) => PAID || quotaRemaining === null || quotaRemaining - needed >= QUOTA_RESERVE;
export const lastNbaQuota = () => quotaRemaining;

export async function nbaGet(path: string, key: string): Promise<Json[]> {
  const wait = lastCallAt + MIN_GAP_MS - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastCallAt = Date.now();
  const res = await fetch(`${BASE}${path}`, { headers: { 'x-apisports-key': key } });
  const rem = Number(res.headers.get('x-ratelimit-requests-remaining'));
  if (res.headers.has('x-ratelimit-requests-remaining') && Number.isFinite(rem)) quotaRemaining = rem;
  if (!res.ok) throw new Error(`API-NBA ${res.status} ${path}`);
  const body = await res.json();
  const errors = body.errors && (Array.isArray(body.errors) ? body.errors : Object.values(body.errors));
  if (errors?.length) throw new Error(`API-NBA hata: ${JSON.stringify(body.errors)}`);
  return body.response ?? [];
}

const num = (v: unknown): number => {
  const n = typeof v === 'string' ? parseFloat(v) : Number(v);
  return Number.isFinite(n) ? n : 0;
};
const numOrNull = (v: unknown): number | null => (v == null || v === '' ? null : num(v));

/** API-NBA durumu → uygulamanın status_short standardı + ekranda gösterilecek metin */
export function normalizeStatus(g: Json): { status_short: string; status_detail: string | null; period: number | null } {
  const short = g.status?.short;
  const period: number | null = g.periods?.current ?? null;
  if (short === 3) return { status_short: 'FT', status_detail: period && period > 4 ? 'Maç Sonu (UZ)' : 'Maç Sonu', period };
  if (short === 2) {
    if (g.status?.halftime) return { status_short: 'HT', status_detail: 'Devre Arası', period };
    const p = period ?? 1;
    const label = p > 4 ? `UZ${p - 4}` : `Q${p}`;
    if (g.periods?.endOfPeriod) return { status_short: 'LIVE', status_detail: `${label} bitti`, period };
    const clock: string | null = g.status?.clock ?? null;
    return { status_short: 'LIVE', status_detail: clock ? `${label} ${clock.padStart(5, '0')}` : label, period };
  }
  return { status_short: 'NS', status_detail: null, period: null };
}

const linescore = (s: Json): number[] =>
  (s?.linescore ?? []).filter((x: unknown) => x !== '' && x != null).map(num);

/** /games yanıtı → matches satırı (temel alanlar) */
export function mapGame(g: Json) {
  const st = normalizeStatus(g);
  const ph = linescore(g.scores?.home);
  const pa = linescore(g.scores?.visitors);
  return {
    fixture_id: toFixtureId(g.id),
    sport_type: 'nba',
    league_id: null,
    league_name: 'NBA',
    league_country: 'ABD',
    league_priority: 1,
    kickoff_at: g.date?.start,
    home_team: g.teams?.home?.name,
    away_team: g.teams?.visitors?.name,
    home_team_id: g.teams?.home?.id ?? null,
    away_team_id: g.teams?.visitors?.id ?? null,
    // Wikimedia SVG → PNG (Android Image SVG çizemez); bkz. nbaBox.ts
    home_logo: normalizeNbaLogo(g.teams?.home?.logo),
    away_logo: normalizeNbaLogo(g.teams?.visitors?.logo),
    home_score: st.status_short === 'NS' ? null : (g.scores?.home?.points ?? null),
    away_score: st.status_short === 'NS' ? null : (g.scores?.visitors?.points ?? null),
    status_short: st.status_short,
    elapsed_minute: st.period,
    status_detail: st.status_detail,
    period_scores: ph.length || pa.length ? { home: ph, away: pa } : null,
  };
}

/** /games/statistics?id= → ev ve deplasman kutu skoru */
export function mapTeamBoxes(stats: Json[], homeTeamName: string): { home: NbaTeamBox; away: NbaTeamBox } | null {
  if (stats.length !== 2) return null;
  const box = (t: Json): NbaTeamBox => {
    const s = t.statistics?.[0] ?? {};
    return {
      points: num(s.points),
      fgm: num(s.fgm),
      fga: num(s.fga),
      ftm: num(s.ftm),
      fta: num(s.fta),
      tpm: num(s.tpm),
      tpa: num(s.tpa),
      off_reb: num(s.offReb),
      def_reb: num(s.defReb),
      tot_reb: num(s.totReb),
      assists: num(s.assists),
      turnovers: num(s.turnovers),
      steals: num(s.steals),
      blocks: num(s.blocks),
      fouls: num(s.pFouls),
      points_in_paint: numOrNull(s.pointsInPaint),
      points_off_turnovers: numOrNull(s.pointsOffTurnovers),
      second_chance_points: numOrNull(s.secondChancePoints),
      fast_break_points: numOrNull(s.fastBreakPoints),
    };
  };
  // Ev sahibi, veritabanındaki takım adıyla eşleştirilir (ek /games isteği gerekmez)
  const home = stats.find((t) => t.team?.name === homeTeamName);
  const away = stats.find((t) => t.team?.name !== homeTeamName);
  return home && away ? { home: box(home), away: box(away) } : null;
}

const POS: Record<string, string> = { G: 'Guard', F: 'Forvet', C: 'Pivot', 'G-F': 'Guard-Forvet', 'F-C': 'Forvet-Pivot' };

/**
 * /players/statistics?game= → oyuncu satırları.
 * VARSAYIM: API ilk 5'i ayrı bir alanla işaretlemiyor; her takımın listesinin ilk 5 oyuncusu
 * kutu skorundaki ilk beşle örtüşüyor. Yanlış çıkarsa yalnızca bench metrikleri etkilenir.
 */
export function mapPlayers(rows: Json[], homeTeamName: string): NbaPlayerLine[] {
  const seen: Record<'home' | 'away', number> = { home: 0, away: 0 };
  return rows.map((p) => {
    const team: 'home' | 'away' = p.team?.name === homeTeamName ? 'home' : 'away';
    const starter = seen[team] < 5;
    seen[team]++;
    return {
      name: `${p.player?.firstname ?? ''} ${p.player?.lastname ?? ''}`.trim(),
      team,
      starter,
      position: POS[p.pos] ?? p.pos ?? '—',
      minutes: num(p.min),
      points: num(p.points),
      rebounds: num(p.totReb),
      assists: num(p.assists),
      plus_minus: num(p.plusMinus),
      fgm: num(p.fgm),
      fga: num(p.fga),
      tpm: num(p.tpm),
      tpa: num(p.tpa),
      fta: num(p.fta),
      ftm: num(p.ftm),
      off_reb: num(p.offReb),
      def_reb: num(p.defReb),
      steals: num(p.steals),
      blocks: num(p.blocks),
      fouls: num(p.pFouls),
      turnovers: num(p.turnovers),
    };
  });
}
