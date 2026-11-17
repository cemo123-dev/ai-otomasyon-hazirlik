// pg_cron ile çağrılır (bkz. 0004_quota.sql):
//   mode=live     → maç saatlerinde (TSİ 02:00-09:30) canlı NBA skorları + yeni bitenler
//   mode=schedule → günde 1 kez dün/bugün/yarın fikstürü
// Her iki modda da biten ve istatistiği olmayan maçlar için kutu skoru çekilip
// ön-hesaplama motoru (nbaMetrics.ts) çalıştırılır; teaser şablonla yazılır (0 token).
// Kota API-Football ile ortaktır: isteğe bağlı çekimler kota bekçisine (hasNbaQuota) tabidir.
import { buildNbaTeaser, pickTopPlayers, type NbaMatchRow } from '../_shared/nbaAnalysis.ts';
import { hasNbaQuota, lastNbaQuota, mapGame, mapPlayers, mapTeamBoxes, nbaGet, toGameId } from '../_shared/nbaApi.ts';
import { isMissingBoxColumn, toBoxScore } from '../_shared/nbaBox.ts';
import { computeNbaMetrics, type NbaPlayerLine } from '../_shared/nbaMetrics.ts';
import { runNbaAlerts } from '../_shared/alertStore.ts';
import { admin, authorized, json } from '../_shared/supabaseAdmin.ts';
import { followTeamFixtures, notifyKickoffs } from '../_shared/teamEvents.ts';

const KEY = Deno.env.get('API_FOOTBALL_KEY')!; // api-sports anahtarı NBA için de geçerli
/** Seri alarmı dakikalık skor görüntüsü ister: yalnız ücretli planda (dakikalık cron) */
const PAID = Deno.env.get('API_FOOTBALL_PAID') === '1';
/** Tek çalıştırmada kutu skoru çekilecek en fazla maç (maç başına 2 istek) */
const MAX_ENRICH = Number(Deno.env.get('NBA_MAX_ENRICH') ?? 3);

const edgeRuntime = (globalThis as { EdgeRuntime?: { waitUntil(p: Promise<unknown>): void } }).EdgeRuntime;

Deno.serve(async (req) => {
  if (!(await authorized(req))) return json({ error: 'unauthorized' }, 401);
  const { mode = 'live' } = await req.json().catch(() => ({}));

  const task = (mode === 'schedule' ? syncSchedule() : syncLive())
    .then(async (r) => ({ ...r, enriched: await enrichFinished(), quota: lastNbaQuota() }))
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
  // Veri tazeliği: kaynak şu an kontrol edildi (uygulamada "Son güncelleme HH:MM")
  const now = new Date().toISOString();
  const { error } = await admin
    .from('matches')
    .upsert(rows.map((r) => ({ ...r, updated_at: now })), { onConflict: 'fixture_id' });
  if (error) throw error;
}

const utcDate = (iso: string | Date) => new Date(iso).toISOString().slice(0, 10);

async function syncSchedule() {
  const day = (offset: number) => utcDate(new Date(Date.now() + offset * 86400_000));
  let count = 0;
  const skipped: string[] = [];
  for (const date of [day(-1), day(0), day(1)]) {
    try {
      const rows = (await nbaGet(`/games?date=${date}`, KEY)).map(mapGame);
      await upsert(rows);
      count += rows.length;
      await followTeamFixtures(rows.filter((r) => r.status_short === 'NS').map((r) => r.fixture_id));
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
    games = (await nbaGet(`/games?date=${utcDate(new Date())}`, KEY)).filter((g) => g.status?.short === 2);
  }
  const live = games.map(mapGame);
  await upsert(live);
  // "Maç başladı": yalnız 1. çeyrekte yakalanan maçlar
  const kickoffs = await notifyKickoffs(live.filter((r) => r.status_short === 'LIVE'), 'nba', 1);

  // 2) DB'de canlı görünen ama listeden düşen maçlar → bitmiş olabilir.
  //    Maç başına 1 istek yerine, başlama tarihine göre gün başına 1 istekle güncellenir.
  const liveIds = new Set(live.map((r) => r.fixture_id));
  const { data: dbLive, error } = await admin
    .from('matches')
    .select('fixture_id, kickoff_at')
    .eq('sport_type', 'nba')
    .in('status_short', ['LIVE', 'HT']);
  if (error) throw error;
  const gone = (dbLive ?? []).filter((r) => !liveIds.has(r.fixture_id as number));
  const goneIds = new Set(gone.map((r) => r.fixture_id as number));
  const dates = [...new Set(gone.map((r) => utcDate(r.kickoff_at as string)))];
  for (const date of dates) {
    const rows = (await nbaGet(`/games?date=${date}`, KEY)).map(mapGame).filter((r) => goneIds.has(r.fixture_id));
    await upsert(rows);
  }
  // Akıllı alarm: NBA seri alarmı (ek istek yok, canlı skorlar zaten çekildi)
  const alerts = PAID ? await runNbaAlerts(live as Parameters<typeof runNbaAlerts>[0]) : 0;
  return { live: live.length, refreshed: gone.length, date_requests: dates.length, alerts, kickoffs };
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
    // Her maç 2 istek ister; ortak kota rezervinin altına inilecekse dur
    if (!hasNbaQuota(2)) {
      console.warn('[sync-nba] kota rezervi korunuyor; kalan maç istatistikleri sonraki çalıştırmaya kaldı');
      break;
    }
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
      await storeBoxScore(m.fixture_id, players);
      done++;
    } catch (e) {
      console.warn(`[sync-nba] ${m.fixture_id} istatistik atlandı:`, e instanceof Error ? e.message : e);
    }
  }
  return done + (await backfillBoxScores(MAX_ENRICH - done));
}

/** Box score ayrı yazılır: 0014 yoksa yalnız uyarı (senkron durmaz). Dönüş: false = kolon yok */
async function storeBoxScore(fixtureId: number, players: NbaPlayerLine[]): Promise<boolean> {
  const box = toBoxScore(players);
  if (!box) return true;
  const { error } = await admin.from('matches').update({ box_score: box }).eq('fixture_id', fixtureId);
  if (isMissingBoxColumn(error)) {
    console.warn('[sync-nba] 0014_nba_box.sql kurulmamış; box score atlandı');
    return false;
  }
  if (error) console.warn(`[sync-nba] ${fixtureId} box score yazılamadı:`, error.message);
  return true;
}

/**
 * Önceden işlenmiş (istatistiği olan) ama box score'u olmayan son 2 günün maçları:
 * yalnız oyuncu istatistiği çekilir (maç başına 1 istek, kota bekçisine tabi).
 */
async function backfillBoxScores(limit: number): Promise<number> {
  if (limit <= 0) return 0;
  const since = new Date(Date.now() - 2 * 86400_000).toISOString();
  const { data, error } = await admin
    .from('matches')
    .select('fixture_id, home_team')
    .eq('sport_type', 'nba')
    .eq('status_short', 'FT')
    .not('stats', 'is', null)
    .is('box_score', null)
    .gte('kickoff_at', since)
    .order('kickoff_at', { ascending: false })
    .limit(limit);
  if (error) {
    if (!isMissingBoxColumn(error)) console.warn('[sync-nba] box score geri doldurma sorgusu:', error.message);
    return 0;
  }
  let n = 0;
  for (const m of data ?? []) {
    if (!hasNbaQuota(1)) break;
    try {
      const players = mapPlayers(await nbaGet(`/players/statistics?game=${toGameId(m.fixture_id)}`, KEY), m.home_team);
      if (!(await storeBoxScore(m.fixture_id, players))) break;
      n++;
    } catch (e) {
      console.warn(`[sync-nba] ${m.fixture_id} box score geri doldurma atlandı:`, e instanceof Error ? e.message : e);
    }
  }
  return n;
}
