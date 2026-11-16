import type { MatchEvent, MatchRow, MatchStats, TeamStats, TopPlayer } from './types.ts';

// API-Football v3 (api-sports.io). Yalnızca sunucu tarafında çağrılır.
const BASE = 'https://v3.football.api-sports.io';

/** Takip edilen ligler: API-Football league id → sıralama önceliği + Türkçe ülke adı */
export const LEAGUES: Record<number, { priority: number; country: string }> = {
  203: { priority: 1, country: 'Türkiye' }, // Süper Lig
  2: { priority: 2, country: 'Avrupa' }, // UEFA Şampiyonlar Ligi
  39: { priority: 3, country: 'İngiltere' }, // Premier League
  140: { priority: 4, country: 'İspanya' }, // LaLiga
  135: { priority: 5, country: 'İtalya' }, // Serie A
  78: { priority: 6, country: 'Almanya' }, // Bundesliga
  61: { priority: 7, country: 'Fransa' }, // Ligue 1
  3: { priority: 8, country: 'Avrupa' }, // UEFA Avrupa Ligi
  848: { priority: 9, country: 'Avrupa' }, // UEFA Konferans Ligi
};

// deno-lint-ignore no-explicit-any
type Json = any;

export async function apiGet(path: string, key: string): Promise<Json[]> {
  const res = await fetch(`${BASE}${path}`, { headers: { 'x-apisports-key': key } });
  if (!res.ok) throw new Error(`API-Football ${res.status} ${path}`);
  const body = await res.json();
  const errors = body.errors && (Array.isArray(body.errors) ? body.errors : Object.values(body.errors));
  if (errors?.length) throw new Error(`API-Football hata: ${JSON.stringify(body.errors)}`);
  return body.response ?? [];
}

/** fixtures?ids= en fazla 20 id kabul eder; olay, istatistik, kadro ve oyuncu verisi döndürür */
export async function getFixturesByIds(ids: number[], key: string): Promise<Json[]> {
  const out: Json[] = [];
  for (let i = 0; i < ids.length; i += 20) {
    out.push(...(await apiGet(`/fixtures?ids=${ids.slice(i, i + 20).join('-')}`, key)));
  }
  return out;
}

export const isTracked = (f: Json) => f?.league?.id in LEAGUES;

/** Her fixture yanıtında bulunan temel alanlar (skor, durum, dakika) */
export function mapCore(f: Json): Partial<MatchRow> {
  const lg = LEAGUES[f.league.id];
  return {
    fixture_id: f.fixture.id,
    league_id: f.league.id,
    league_name: f.league.name,
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
