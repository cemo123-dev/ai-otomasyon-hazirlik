import type { MatchEvent, MatchRow, MatchStats, TeamStats, TopPlayer } from './types.ts';

// API-Football v3 (api-sports.io). Yalnızca sunucu tarafında çağrılır.
const BASE = 'https://v3.football.api-sports.io';

/**
 * BEYAZ LİSTE — yalnızca erkek A takım müsabakaları.
 * API-Football'da kadın, U21/U19 ve alt ligler ayrı league id'lere sahip olduğu için
 * burada olmayan hiçbir maç uygulamaya girmez.
 * (ID'ler API-Football /leagues uç noktasıyla doğrulanmalıdır.)
 */
type LeagueInfo = { priority: number; country: string; name: string; turkeyOnly?: boolean };

export const LEAGUES: Record<number, LeagueInfo> = {
  // Türkiye
  203: { priority: 1, country: 'Türkiye', name: 'Süper Lig' },
  // Milli takımlar
  1: { priority: 2, country: 'Milli Takımlar', name: 'Dünya Kupası' },
  4: { priority: 3, country: 'Milli Takımlar', name: 'Avrupa Şampiyonası' },
  32: { priority: 4, country: 'Milli Takımlar', name: 'Dünya Kupası Avrupa Elemeleri' },
  960: { priority: 5, country: 'Milli Takımlar', name: 'Avrupa Şampiyonası Elemeleri' },
  5: { priority: 6, country: 'Milli Takımlar', name: 'UEFA Uluslar Ligi' },
  10: { priority: 7, country: 'Milli Takımlar', name: 'Hazırlık Maçı', turkeyOnly: true },
  // UEFA kulüp turnuvaları
  2: { priority: 8, country: 'Avrupa', name: 'UEFA Şampiyonlar Ligi' },
  3: { priority: 9, country: 'Avrupa', name: 'UEFA Avrupa Ligi' },
  848: { priority: 10, country: 'Avrupa', name: 'UEFA Konferans Ligi' },
  531: { priority: 11, country: 'Avrupa', name: 'UEFA Süper Kupa' },
  // En çok izlenen yabancı 1. ligler
  39: { priority: 12, country: 'İngiltere', name: 'Premier League' },
  140: { priority: 13, country: 'İspanya', name: 'LaLiga' },
  135: { priority: 14, country: 'İtalya', name: 'Serie A' },
  78: { priority: 15, country: 'Almanya', name: 'Bundesliga' },
  61: { priority: 16, country: 'Fransa', name: 'Ligue 1' },
};

const TURKEY = new Set(['turkey', 'türkiye', 'turkiye']);
// Beyaz listeye ek güvence: adında kadın/altyapı işareti olan takım veya lig girmez
const NON_SENIOR_MEN = /\b(women|womens|féminine|femenino|frauen|W|U1[5-9]|U2[0-3]|youth|reserves?)\b/i;

// deno-lint-ignore no-explicit-any
type Json = any;

// Ücretsiz plan: dakikada en fazla 10 istek → istekler arası ~6,5 sn bekle (ücretli planda bekleme yok)
export const PAID = Deno.env.get('API_FOOTBALL_PAID') === '1';
const MIN_GAP_MS = PAID ? 0 : 6500;
let lastCallAt = 0;

/**
 * KOTA BEKÇİSİ — API-Football ve API-NBA aynı günlük kotayı paylaşır.
 * Futbol işleri, gece NBA senkronu için en az QUOTA_RESERVE isteği bırakır;
 * isteğe bağlı detay çekimleri bu eşiğin altında atlanır.
 */
const QUOTA_RESERVE = Number(Deno.env.get('FOOTBALL_QUOTA_RESERVE') ?? 45);
let quotaRemaining: number | null = null;
export const hasQuotaForOptional = () => PAID || quotaRemaining === null || quotaRemaining > QUOTA_RESERVE;
export const lastQuotaRemaining = () => quotaRemaining;

export async function apiGet(path: string, key: string): Promise<Json[]> {
  const wait = lastCallAt + MIN_GAP_MS - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastCallAt = Date.now();
  const res = await fetch(`${BASE}${path}`, { headers: { 'x-apisports-key': key } });
  const rem = Number(res.headers.get('x-ratelimit-requests-remaining'));
  if (Number.isFinite(rem) && res.headers.has('x-ratelimit-requests-remaining')) quotaRemaining = rem;
  if (!res.ok) throw new Error(`API-Football ${res.status} ${path}`);
  const body = await res.json();
  const errors = body.errors && (Array.isArray(body.errors) ? body.errors : Object.values(body.errors));
  if (errors?.length) throw new Error(`API-Football hata: ${JSON.stringify(body.errors)}`);
  return body.response ?? [];
}

/** Ücretsiz planda tek çalıştırmada tek tek çekilecek en fazla maç (günlük 100 istek kotası) */
const MAX_SINGLE_FETCH = Number(Deno.env.get('API_FOOTBALL_MAX_SINGLE_FETCH') ?? 3);
// Ücretli plana geçince Edge Function secret'ı API_FOOTBALL_PAID=1 yapın (toplu ids= çekimi açılır)
let idsParamBlocked = !PAID;

/**
 * Olay, istatistik, kadro ve oyuncu verisiyle maç detayı.
 * Ücretli plan: fixtures?ids= (20 maç = 1 istek).
 * Ücretsiz plan "ids" parametresini kapattığı için fixtures?id= ile tek tek çekilir.
 */
export async function getFixturesByIds(ids: number[], key: string): Promise<Json[]> {
  const out: Json[] = [];
  if (!idsParamBlocked) {
    try {
      for (let i = 0; i < ids.length; i += 20) {
        out.push(...(await apiGet(`/fixtures?ids=${ids.slice(i, i + 20).join('-')}`, key)));
      }
      return out;
    } catch (e) {
      if (!(e instanceof Error && /ids parameter/i.test(e.message))) throw e;
      idsParamBlocked = true; // aynı instance'ta tekrar denenmez
    }
  }
  for (const id of ids.slice(0, MAX_SINGLE_FETCH)) {
    if (!hasQuotaForOptional()) {
      console.warn(`[api-football] kota rezervi (${QUOTA_RESERVE}) korunuyor; kalan detaylar sonraki çalıştırmaya kaldı`);
      break;
    }
    try {
      out.push(...(await apiGet(`/fixtures?id=${id}`, key)));
    } catch (e) {
      // Bir maçın detayı alınamazsa diğerleri yine yazılsın; bir sonraki çalıştırmada tekrar denenir
      console.warn(`[api-football] fixture ${id} atlandı:`, e instanceof Error ? e.message : e);
    }
  }
  return out;
}

export function isTracked(f: Json): boolean {
  const lg = LEAGUES[f?.league?.id];
  if (!lg) return false;
  const home: string = f.teams?.home?.name ?? '';
  const away: string = f.teams?.away?.name ?? '';
  if ([f.league?.name ?? '', home, away].some((s) => NON_SENIOR_MEN.test(s))) return false;
  // Hazırlık maçları: dünyadaki tüm milli maçlar yerine yalnızca Türkiye'ninkiler
  if (lg.turkeyOnly) return [home, away].some((t) => TURKEY.has(t.toLocaleLowerCase('tr')));
  return true;
}

/**
 * Milli takım turnuvalarında maçları alt gruplara ayırır. API'nin "round" alanı:
 *   Uluslar Ligi → "League A - 6"   ⇒ "UEFA Uluslar Ligi · Lig A"
 *   Elemeler     → "Group C - 5"    ⇒ "Dünya Kupası Avrupa Elemeleri · Grup C"
 * (Uluslar Ligi'nde grup numarası round'da yok; ücretsiz plan puan durumunu da vermiyor.)
 */
function withStage(lg: LeagueInfo | undefined, apiName: string, round: string | null | undefined): string {
  const name = lg?.name ?? apiName;
  if (lg?.country !== 'Milli Takımlar' || !round) return name;
  const league = round.match(/\bLeague ([A-D])\b/i);
  if (league) return `${name} · Lig ${league[1].toUpperCase()}`;
  const group = round.match(/\bGroup ([A-L])\b/i);
  if (group) return `${name} · Grup ${group[1].toUpperCase()}`;
  return name;
}

/** Her fixture yanıtında bulunan temel alanlar (skor, durum, dakika) */
export function mapCore(f: Json): Partial<MatchRow> {
  const lg = LEAGUES[f.league.id];
  return {
    fixture_id: f.fixture.id,
    league_id: f.league.id,
    league_name: withStage(lg, f.league.name, f.league.round),
    league_country: lg?.country ?? f.league.country ?? null,
    league_priority: lg?.priority ?? 99,
    kickoff_at: f.fixture.date,
    home_team: f.teams.home.name,
    away_team: f.teams.away.name,
    home_score: f.goals.home,
    away_score: f.goals.away,
    status_short: f.fixture.status.short,
    elapsed_minute: f.fixture.status.elapsed,
  };
}

/** fixtures?ids= yanıtındaki detaylar */
export function mapDetails(f: Json): Partial<MatchRow> {
  const homeId = f.teams.home.id;
  const side = (teamId: number): 'home' | 'away' => (teamId === homeId ? 'home' : 'away');
  const out: Partial<MatchRow> = {};

  if (Array.isArray(f.events)) out.events = f.events.map((e: Json) => mapEvent(e, side)).filter(Boolean);
  if (Array.isArray(f.statistics) && f.statistics.length === 2) out.stats = mapStats(f.statistics, side);
  if (Array.isArray(f.lineups)) {
    for (const l of f.lineups) {
      if (side(l.team.id) === 'home') out.home_coach = l.coach?.name ?? null;
      else out.away_coach = l.coach?.name ?? null;
    }
  }
  if (Array.isArray(f.players) && f.players.length) out.top_players = mapTopPlayers(f.players, side);
  return out;
}

function mapEvent(e: Json, side: (id: number) => 'home' | 'away'): MatchEvent | null {
  const base = { minute: e.time.elapsed, extra: e.time.extra, team: side(e.team.id), player: e.player?.name ?? '—' };
  const detail: string = e.detail ?? '';
  switch (e.type) {
    case 'Goal':
      if (detail === 'Missed Penalty') return null;
      if (detail === 'Own Goal') return { ...base, type: 'own_goal' };
      if (detail === 'Penalty') return { ...base, type: 'penalty_goal' };
      return { ...base, type: 'goal', detail: e.assist?.name ?? null };
    case 'Card':
      if (detail.startsWith('Red') || detail.startsWith('Second')) {
        return { ...base, type: 'red_card', detail: detail.startsWith('Second') ? 'İkinci sarı' : null };
      }
      return { ...base, type: 'yellow_card' };
    case 'subst':
      // API-Football değişiklik olayında player/assist yönü sağlayıcıya göre değişebiliyor;
      // canlı veriyle doğrulayıp gerekirse burada yer değiştirin.
      return { ...base, type: 'substitution', player: e.assist?.name ?? base.player, detail: e.player?.name ?? null };
    case 'Var':
      return { ...base, type: 'var', detail };
    default:
      return null;
  }
}

function mapStats(statistics: Json[], side: (id: number) => 'home' | 'away'): MatchStats {
  const pick = (list: Json[], name: string): number => {
    const v = list.find((s: Json) => s.type === name)?.value;
    if (v == null) return 0;
    return typeof v === 'string' ? parseFloat(v.replace('%', '')) || 0 : Number(v);
  };
  const res = {} as MatchStats;
  for (const t of statistics) {
    const s: Json[] = t.statistics;
    const ts: TeamStats = {
      possession: pick(s, 'Ball Possession'),
      xg: pick(s, 'expected_goals'),
      shots_total: pick(s, 'Total Shots'),
      shots_on_target: pick(s, 'Shots on Goal'),
      shots_inside_box: pick(s, 'Shots insidebox'),
      shots_outside_box: pick(s, 'Shots outsidebox'),
      passes_accuracy: pick(s, 'Passes %'),
      corners: pick(s, 'Corner Kicks'),
      fouls: pick(s, 'Fouls'),
    };
    res[side(t.team.id)] = ts;
  }
  return res;
}

const POS: Record<string, string> = { G: 'Kaleci', D: 'Defans', M: 'Orta Saha', F: 'Forvet' };

/** En yüksek puanlı 6 oyuncu: LLM'e yalnızca bunlar gider (token tasarrufu) */
function mapTopPlayers(players: Json[], side: (id: number) => 'home' | 'away'): TopPlayer[] {
  const all: TopPlayer[] = [];
  for (const t of players) {
    for (const p of t.players ?? []) {
      const st = p.statistics?.[0];
      const rating = parseFloat(st?.games?.rating ?? '');
      if (!st || !Number.isFinite(rating) || !st.games?.minutes) continue;
      all.push({
        name: p.player.name,
        team: side(t.team.id),
        position: POS[st.games.position] ?? st.games.position ?? '—',
        rating,
        goals: st.goals?.total ?? 0,
        assists: st.goals?.assists ?? 0,
        key_passes: st.passes?.key ?? 0,
        tackles: st.tackles?.total ?? 0,
        duels_won: st.duels?.won ?? 0,
        shots: st.shots?.total ?? 0,
      });
    }
  }
  return all.sort((a, b) => b.rating - a.rating).slice(0, 6);
}

// ═══════════════════════════════════════════════ Maç öncesi (Pre-Match AI) yardımcıları

/** player_match_stats satırı (bkz. 0005_prematch.sql) */
export type PlayerMatchRow = {
  fixture_id: number;
  player_id: number;
  team_id: number;
  team_name: string;
  name: string;
  position: string | null;
  kickoff_at: string;
  started: boolean;
  minutes: number;
  rating: number | null;
  duels_total: number;
  duels_won: number;
  dribbles_att: number;
  dribbles_succ: number;
  dribbled_past: number;
  tackles: number;
  interceptions: number;
  key_passes: number;
  shots: number;
  goals: number;
  assists: number;
};

const n0 = (v: unknown) => {
  const x = typeof v === 'string' ? parseFloat(v) : Number(v);
  return Number.isFinite(x) ? x : 0;
};

/** Maç detayındaki TÜM oyuncular → player_match_stats satırları (sahaya çıkmayanlar hariç) */
export function mapPlayerMatchRows(f: Json): PlayerMatchRow[] {
  const out: PlayerMatchRow[] = [];
  const starters = new Set<number>();
  for (const l of f.lineups ?? []) for (const s of l.startXI ?? []) if (s.player?.id) starters.add(s.player.id);
  for (const t of f.players ?? []) {
    for (const p of t.players ?? []) {
      const st = p.statistics?.[0];
      const minutes = n0(st?.games?.minutes);
      if (!st || !p.player?.id || minutes <= 0) continue;
      const rating = parseFloat(st.games?.rating ?? '');
      out.push({
        fixture_id: f.fixture.id,
        player_id: p.player.id,
        team_id: t.team.id,
        team_name: t.team.name,
        name: p.player.name,
        position: st.games?.position ?? null,
        kickoff_at: f.fixture.date,
        // İlk 11 kadrodan; kadro yoksa "oyuna sonradan girmedi" varsayımı
        started: starters.size ? starters.has(p.player.id) : !st.games?.substitute,
        minutes,
        rating: Number.isFinite(rating) && rating > 0 ? rating : null,
        duels_total: n0(st.duels?.total),
        duels_won: n0(st.duels?.won),
        dribbles_att: n0(st.dribbles?.attempts),
        dribbles_succ: n0(st.dribbles?.success),
        dribbled_past: n0(st.dribbles?.past),
        tackles: n0(st.tackles?.total),
        interceptions: n0(st.tackles?.interceptions),
        key_passes: n0(st.passes?.key),
        shots: n0(st.shots?.total),
        goals: n0(st.goals?.total),
        assists: n0(st.goals?.assists),
      });
    }
  }
  return out;
}

/** İlk 11'ler (ücretsiz planda açık). Boş dizi = henüz açıklanmadı. */
export const getLineups = (fixtureId: number, key: string) => apiGet(`/fixtures/lineups?fixture=${fixtureId}`, key);

/** Sakat/cezalı listesi (kapsama lige göre değişir) */
export const getInjuries = (fixtureId: number, key: string) => apiGet(`/injuries?fixture=${fixtureId}`, key);

/** Takımın son N bitmiş maçının id'leri — "last" parametresi yalnızca ÜCRETLİ planda */
export async function getTeamLastFixtureIds(teamId: number, n: number, key: string): Promise<number[]> {
  if (!PAID) return [];
  return (await apiGet(`/fixtures?team=${teamId}&last=${n}&status=FT`, key)).map((f) => f.fixture.id as number);
}
