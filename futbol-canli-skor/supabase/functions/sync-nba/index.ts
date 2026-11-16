// pg_cron ile çağrılır (bkz. 0003_nba.sql):
//   mode=live     → maç saatlerinde (TSİ 02:00-09:30) canlı NBA skorları + yeni bitenler
//   mode=schedule → günde 2 kez dün/bugün/yarın fikstürü
// Her iki modda da biten ve istatistiği olmayan maçlar için kutu skoru çekilip
// ön-hesaplama motoru (nbaMetrics.ts) çalıştırılır; teaser şablonla yazılır (0 token).
import { buildNbaTeaser, pickTopPlayers, type NbaMatchRow } from '../_shared/nbaAnalysis.ts';
import { mapGame, mapPlayers, mapTeamBoxes, nbaGet, toGameId } from '../_shared/nbaApi.ts';
import { computeNbaMetrics } from '../_shared/nbaMetrics.ts';
import { admin, authorized, json } from '../_shared/supabaseAdmin.ts';

const KEY = Deno.env.get('API_FOOTBALL_KEY')!; // api-sports anahtarı NBA için de geçerli
/** Tek çalıştırmada kutu skoru çekilecek en fazla maç (maç başına 2 istek; günlük 100 kota) */
const MAX_ENRICH = Number(Deno.env.get('NBA_MAX_ENRICH') ?? 3);

const edgeRuntime = (globalThis as { EdgeRuntime?: { waitUntil(p: Promise<unknown>): void } }).EdgeRuntime;

Deno.serve(async (req) => {
  if (!(await authorized(req))) return json({ error: 'unauthorized' }, 401);
  const { mode = 'live' } = await req.json().catch(() => ({}));

  const task = (mode === 'schedule' ? syncSchedule() : syncLive())
    .then(async (r) => ({ ...r, enriched: await enrichFinished() }))
    .then((r) => console.log(`[sync-nba] ${mode} ok`, JSON.stringify(r)))
    .catch((e) => console.error(`[sync-nba] ${mode} HATA`, e instanceof Error ? e.message : e));

  if (edgeRuntime) {
    edgeRuntime.waitUntil(task);
    return json({ ok: true, accepted: true, mode }, 202);
  }
  await task;
  return json({ ok: true, mode });
});

async function upsert(rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const { error } = await admin.from('matches').upsert(rows, { onConflict: 'fixture_id' });
  if (error) throw error;
}

async function syncSchedule() {
  const day = (offset: number) => new Date(Date.now() + offset * 86400_000).toISOString().slice(0, 10);
  let count = 0;
  const skipped: string[] = [];
  for (const date of [day(-1), day(0), day(1)]) {
    try {
      const rows = (await nbaGet(`/games?date=${date}`, KEY)).map(mapGame);
      await upsert(rows);
      count += rows.length;
    } catch (e) {
      skipped.push(`${date}: ${e instanceof Error ? e.message : e}`);
    }
  }
  return { scheduled: count, skipped };
}

async function syncLive() {
  // 1) Canlı maçlar (1 istek). Plan "live" parametresini kapatmışsa bugünün tarih sorgusuna düş.
  let games;
  try {
    games = await nbaGet('/games?live=all', KEY);
  } catch (e) {
    console.warn('[sync-nba] live=all kullanılamadı, tarih sorgusuna geçiliyor:', e instanceof Error ? e.message : e);
    games = (await nbaGet(`/games?date=${new Date().toISOString().slice(0, 10)}`, KEY)).filter((g) => g.status?.short === 2);
  }
  const live = games.map(mapGame);
  await upsert(live);

  // 2) DB'de canlı görünen ama listeden düşen maçlar → bitmiş olabilir, tek tek güncelle
  const liveIds = new Set(live.map((r) => r.fixture_id));
  const { data: dbLive, error } = await admin
    .from('matches')
    .select('fixture_id')
    .eq('sport_type', 'nba')
    .in('status_short', ['LIVE', 'HT']);
  if (error) throw error;
  const gone = (dbLive ?? []).map((r) => r.fixture_id as number).filter((id) => !liveIds.has(id));
  for (const fid of gone.slice(0, 5)) {
    await upsert((await nbaGet(`/games?id=${toGameId(fid)}`, KEY)).map(mapGame));
  }
  return { live: live.length, refreshed: Math.min(gone.length, 5) };
}

/** Biten ama istatistiği olmayan maçlar: kutu skoru + ön-hesaplama + şablon teaser */
async function enrichFinished() {
  const since = new Date(Date.now() - 2 * 86400_000).toISOString();
  const { data, error } = await admin
    .from('matches')
    .select('fixture_id, home_team, away_team, home_score, away_score, status_short, period_scores')
    .eq('sport_type', 'nba')
    .eq('status_short', 'FT')
    .is('stats', null)
    .gte('kickoff_at', since)
    .order('kickoff_at', { ascending: false })
    .limit(MAX_ENRICH);
  if (error) throw error;

  let done = 0;
  for (const m of data ?? []) {
    const gameId = toGameId(m.fixture_id);
    try {
      const boxes = mapTeamBoxes(await nbaGet(`/games/statistics?id=${gameId}`, KEY), m.home_team);
      if (!boxes) continue;
      const players = mapPlayers(await nbaGet(`/players/statistics?game=${gameId}`, KEY), m.home_team);
      const periods = (m.period_scores as { home: number[]; away: number[] } | null) ?? { home: [], away: [] };
      const metrics = computeNbaMetrics(
        { home: boxes.home, away: boxes.away, periods, players },
        { home: m.home_team, away: m.away_team },
      );
      const row: NbaMatchRow = {
        fixture_id: m.fixture_id,
        home_team: m.home_team,
        away_team: m.away_team,
        home_score: m.home_score,
        away_score: m.away_score,
        status_short: m.status_short,
        stats: { home: boxes.home, away: boxes.away, metrics },
        top_players: pickTopPlayers(players),
      };
      const { error: upErr } = await admin
        .from('matches')
        .update({ stats: row.stats, top_players: row.top_players, summary_teaser: buildNbaTeaser(row) })
        .eq('fixture_id', m.fixture_id);
      if (upErr) throw upErr;
      done++;
    } catch (e) {
      console.warn(`[sync-nba] ${m.fixture_id} istatistik atlandı:`, e instanceof Error ? e.message : e);
    }
  }
  return done;
}
