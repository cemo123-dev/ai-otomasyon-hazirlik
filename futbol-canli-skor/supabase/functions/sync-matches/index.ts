// pg_cron ile çağrılır (bkz. 0002_pipeline.sql):
//   mode=live     → canlı maçların skor/dakika/olay/istatistikleri + yeni bitenler
//   mode=schedule → dün/bugün/yarın fikstürü + biten maçların istatistikleri
import {
  apiGet,
  getFixturesByIds,
  hasQuotaForOptional,
  isTracked,
  lastQuotaRemaining,
  mapCore,
  mapDetails,
  mapPlayerMatchRows,
  PAID,
} from '../_shared/apiFootball.ts';
import { runFootballAlerts } from '../_shared/alertStore.ts';
import { admin, authorized, json } from '../_shared/supabaseAdmin.ts';
import { buildTeaser } from '../_shared/teaser.ts';
import { FINISHED, LIVE, type MatchRow } from '../_shared/types.ts';

const KEY = Deno.env.get('API_FOOTBALL_KEY')!;
const TZ = 'Europe/Istanbul';

// Supabase Edge Runtime: yanıt döndükten sonra işin bitmesini bekler
const edgeRuntime = (globalThis as { EdgeRuntime?: { waitUntil(p: Promise<unknown>): void } }).EdgeRuntime;

Deno.serve(async (req) => {
  if (!(await authorized(req))) return json({ error: 'unauthorized' }, 401);
  const { mode = 'live' } = await req.json().catch(() => ({}));

  // Ücretsiz planda istekler arası bekleme yüzünden iş ~1-2 dk sürebilir;
  // pg_net 60 sn'de zaman aşımına uğramasın diye hemen 202 dönülür, iş arka planda biter.
  const task = (mode === 'schedule' ? syncSchedule() : syncLive())
    .then((r) => console.log(`[sync-matches] ${mode} ok`, JSON.stringify(r)))
    .catch((e) => console.error(`[sync-matches] ${mode} HATA`, e instanceof Error ? e.message : e));

  if (edgeRuntime) {
    edgeRuntime.waitUntil(task);
    return json({ ok: true, accepted: true, mode }, 202);
  }
  await task;
  return json({ ok: true, mode });
});

async function syncSchedule() {
  const day = (offset: number) => new Date(Date.now() + offset * 86400_000).toLocaleDateString('en-CA', { timeZone: TZ });
  let count = 0;
  const skipped: string[] = [];
  const finishedIds: number[] = [];

  // Dün + bugün + yarın. Ücretsiz plan yalnızca dar bir tarih aralığına izin verir;
  // reddedilen tarih atlanır, diğerleri işlenir.
  for (const date of [day(-1), day(0), day(1)]) {
    let fixtures;
    try {
      fixtures = (await apiGet(`/fixtures?date=${date}&timezone=${TZ}`, KEY)).filter(isTracked);
    } catch (e) {
      skipped.push(`${date}: ${e instanceof Error ? e.message : e}`);
      continue;
    }
    const rows = fixtures.map(mapCore);
    if (rows.length) {
      const { error } = await admin.from('matches').upsert(rows, { onConflict: 'fixture_id' });
      if (error) throw error;
    }
    count += rows.length;
    finishedIds.push(...rows.filter((r) => FINISHED.includes(r.status_short!)).map((r) => r.fixture_id!));
  }

  // Biten ama istatistiği olmayan maçlar: detay + şablon teaser (AI analizi istatistik ister)
  let enriched = 0;
  if (finishedIds.length) {
    const { data: missing, error } = await admin
      .from('matches')
      .select('fixture_id')
      .in('fixture_id', finishedIds)
      .is('stats', null);
    if (error) throw error;
    const ids = (missing ?? []).map((r) => r.fixture_id as number);
    if (ids.length) {
      const fetched = await getFixturesByIds(ids, KEY);
      const details = fetched.map((f) => {
        const row: Partial<MatchRow> = { ...mapCore(f), ...mapDetails(f) };
        row.summary_teaser = buildTeaser(row as MatchRow);
        return row;
      });
      if (details.length) {
        const { error: upErr } = await admin.from('matches').upsert(details, { onConflict: 'fixture_id' });
        if (upErr) throw upErr;
      }
      await storePlayerRows(fetched);
      enriched = details.length;
    }
  }
  return { scheduled: count, enriched, skipped, quota: lastQuotaRemaining() };
}

async function syncLive() {
  // 1) Şu an canlı olan takip edilen maçlar (1 istek): skor, dakika, durum
  const liveList = (await apiGet('/fixtures?live=all', KEY)).filter(isTracked);
  const liveIds = new Set(liveList.map((f) => f.fixture.id as number));
  const coreRows = liveList.map(mapCore);
  if (coreRows.length) {
    const { error: coreErr } = await admin.from('matches').upsert(coreRows, { onConflict: 'fixture_id' });
    if (coreErr) throw coreErr;
  }

  // 1b) Devre arası tespiti → "Soyunma Odası Reçetesi" otomatik kuyruğa (singleflight; her rapor 1 istek).
  //     Ücretli planda cron dakikalık olduğundan HT ~1 dk içinde yakalanır.
  let halftimeQueued = 0;
  for (const r of coreRows.filter((x) => x.status_short === 'HT')) {
    if (!hasQuotaForOptional()) break;
    const { data: claimed, error: cErr } = await admin.rpc('claim_halftime_job', { p_fixture_id: r.fixture_id });
    if (cErr) {
      console.warn('[sync-matches] claim_halftime_job:', cErr.message); // 0006 kurulmadıysa senkronu bozmaz
      break;
    }
    if (claimed) halftimeQueued++;
  }

  // 2) DB'de hâlâ canlı görünen ama listeden düşen FUTBOL maçları = yeni bitenler
  //    (sport_type filtresi şart: aksi halde canlı NBA maçları futbol API'sine sorulur)
  const { data: dbLive, error } = await admin
    .from('matches')
    .select('fixture_id')
    .eq('sport_type', 'football')
    .in('status_short', LIVE);
  if (error) throw error;
  const gone = (dbLive ?? []).map((r) => r.fixture_id as number).filter((id) => !liveIds.has(id));

  // 3) Detaylar (olay, istatistik, kadro). Ücretsiz planda kotayı korumak için yalnızca
  //    yeni biten maçlar; ücretli planda canlı maçlar da (20 maç = 1 istek).
  const ids = PAID ? [...new Set([...liveIds, ...gone])] : gone;
  if (!ids.length) return { live: liveIds.size, finished: 0, halftime_queued: halftimeQueued, quota: lastQuotaRemaining() };
  const fixtures = await getFixturesByIds(ids, KEY);
  let finished = 0;
  const rows: Partial<MatchRow>[] = fixtures.map((f) => {
    const row: Partial<MatchRow> = { ...mapCore(f), ...mapDetails(f) };
    if (FINISHED.includes(row.status_short!)) {
      row.summary_teaser = buildTeaser(row as MatchRow); // ücretsiz özet: 0 token
      finished++;
    }
    return row;
  });

  if (rows.length) {
    const { error: upErr } = await admin.from('matches').upsert(rows, { onConflict: 'fixture_id' });
    if (upErr) throw upErr;
  }
  // Yalnızca biten maçların oyuncu verisi form hafızasına yazılır (canlı veri eksik olabilir)
  await storePlayerRows(fixtures.filter((f) => FINISHED.includes(f.fixture?.status?.short)));

  // 4) Akıllı alarm (yalnız ücretli plan: canlı istatistik + dakikalık senkron gerekir)
  const alerts = PAID ? await runFootballAlerts(rows, LIVE) : 0;
  return { live: liveIds.size, finished, halftime_queued: halftimeQueued, alerts, quota: lastQuotaRemaining() };
}

/**
 * Maç öncesi AI'ın "son 5 maç" formu için tüm oyuncu istatistiklerini saklar (bkz. 0005_prematch.sql).
 * Veri zaten çekilmiş maç detayından gelir: ek API isteği yoktur.
 * Tablo henüz kurulmadıysa senkronu bozmaz, yalnızca uyarı loglar.
 */
async function storePlayerRows(fixtures: unknown[]) {
  const rows = fixtures.flatMap((f) => mapPlayerMatchRows(f));
  if (!rows.length) return;
  const { error } = await admin.from('player_match_stats').upsert(rows, { onConflict: 'fixture_id,player_id' });
  if (error) console.warn('[sync-matches] player_match_stats yazılamadı:', error.message);
}
