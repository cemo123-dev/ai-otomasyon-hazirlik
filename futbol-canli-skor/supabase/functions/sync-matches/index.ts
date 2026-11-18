// pg_cron ile çağrılır (bkz. 0002_pipeline.sql):
//   mode=live     → canlı maçların skor/dakika/olay/istatistikleri + yeni bitenler
//   mode=schedule → fikstür (ücretsiz: dün/bugün/yarın; ücretli: −1…+FIXTURE_DAYS_AHEAD) + biten maçların istatistikleri
// 0018 (Pro API): cron dakikalık tetikler ama app_config.api_paid false iken SQL yalnız ücretsiz takvim
// dakikalarında çağırır; cadence='paid' gelip API_FOOTBALL_PAID kapalıysa burada da ücretsiz takvime inilir.
import {
  apiGet,
  getFixturesByIds,
  hasQuotaForOptional,
  hasQuotaForStatus,
  isTracked,
  lastQuotaRemaining,
  mapCore,
  mapDetails,
  mapPlayerMatchRows,
  MAX_SINGLE_FETCH,
  PAID,
} from '../_shared/apiFootball.ts';
import { runFootballAlerts } from '../_shared/alertStore.ts';
import { storeLineupFields } from '../_shared/lineups.ts';
import { admin, authorized, json } from '../_shared/supabaseAdmin.ts';
import { fixtureDayOffsets, isMinutelyCadence, kickoffWindowMinutes, shouldRunSync, uniqueLocalDates } from '../_shared/syncUtils.ts';
import { followTeamFixtures, notifyKickoffs } from '../_shared/teamEvents.ts';
import { buildTeaser } from '../_shared/teaser.ts';
import { FINISHED, LIVE, type MatchRow } from '../_shared/types.ts';

const KEY = Deno.env.get('API_FOOTBALL_KEY')!;
const TZ = 'Europe/Istanbul';

// Supabase Edge Runtime: yanıt döndükten sonra işin bitmesini bekler
const edgeRuntime = (globalThis as { EdgeRuntime?: { waitUntil(p: Promise<unknown>): void } }).EdgeRuntime;

Deno.serve(async (req) => {
  if (!(await authorized(req))) return json({ error: 'unauthorized' }, 401);
  const { mode = 'live', cadence, slot } = await req.json().catch(() => ({}));

  // İkinci emniyet (0018): DB "ücretli" dese de secret kapalıysa ücretsiz takvim dışında API'ye gidilmez
  if (!shouldRunSync({ mode: mode === 'schedule' ? 'schedule' : 'live', paid: PAID, cadence, slot, now: new Date() })) {
    console.log(`[sync-matches] ${mode} atlandı: ücretsiz plan takvimi dışında (API_FOOTBALL_PAID kapalı)`);
    return json({ ok: true, skipped: 'free_plan_cadence', mode });
  }

  // Ücretsiz planda istekler arası bekleme yüzünden iş ~1-2 dk sürebilir;
  // pg_net 60 sn'de zaman aşımına uğramasın diye hemen 202 dönülür, iş arka planda biter.
  const task = (mode === 'schedule' ? syncSchedule() : syncLive(isMinutelyCadence(PAID, cadence)))
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

  // Ücretsiz: dün + bugün + yarın (plan yalnızca dar bir tarih aralığına izin verir).
  // Ücretli: −1…+FIXTURE_DAYS_AHEAD (varsayılan 7). Reddedilen tarih atlanır, diğerleri işlenir.
  for (const date of fixtureDayOffsets(PAID, PAID ? await fixtureDaysAheadRaw() : undefined).map(day)) {
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
    // Takımı takip edenler yeni maçlara otomatik bağlanır
    await followTeamFixtures(rows.filter((r) => r.status_short === 'NS').map((r) => r.fixture_id!));
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
      await storeLineupFields(admin, fetched); // 0013: kadro + puan (ayrı update; throw etmez)
      await storePlayerRows(fetched);
      enriched = details.length;
    }
  }
  return { scheduled: count, enriched, skipped, quota: lastQuotaRemaining() };
}

/**
 * Ücretli planda kaç gün ileri (Döngü 8 bulgu 8): tek kaynak app_config.fixture_days_ahead (0019;
 * istemci şeridi de aynı değeri okur). 0019 kurulmadıysa eski secret FIXTURE_DAYS_AHEAD (tanımsız → 7).
 */
async function fixtureDaysAheadRaw(): Promise<string | undefined> {
  const { data, error } = await admin.rpc('fixture_days_ahead');
  if (!error && typeof data === 'number') return String(data);
  return Deno.env.get('FIXTURE_DAYS_AHEAD');
}

/** `minutely`: istek dakikalık ücretli takvimden mi (secret açık + cadence 'paid'); "maç başladı" penceresi buna göre */
async function syncLive(minutely: boolean) {
  // 1) Şu an canlı olan takip edilen maçlar (1 istek): skor, dakika, durum
  const liveList = (await apiGet('/fixtures?live=all', KEY)).filter(isTracked);
  const liveIds = new Set(liveList.map((f) => f.fixture.id as number));
  const coreRows = liveList.map(mapCore);
  if (coreRows.length) {
    const { error: coreErr } = await admin.from('matches').upsert(coreRows, { onConflict: 'fixture_id' });
    if (coreErr) throw coreErr;
  }

  // 1a) "Maç başladı" bildirimi: 30 dk'lık senkronda → ilk 35 dk'da yakalananlar; dakikalık ücretli
  //     takvimde → yalnız ilk 5 dk (geç bildirim gitmez). Pencere secret'tan değil istek temposundan (Döngü 8)
  const kickoffs = await notifyKickoffs(
    coreRows.filter((r) => r.status_short === '1H') as { fixture_id: number; home_team: string; away_team: string; elapsed_minute: number | null }[],
    'football',
    kickoffWindowMinutes(minutely),
  );

  // 1b) Devre arası tespiti → "Soyunma Odası Reçetesi" otomatik kuyruğa (singleflight; her rapor 1 istek).
  //     Ücretli planda cron dakikalık olduğundan HT ~1 dk içinde yakalanır.
  let halftimeQueued = 0;
  for (const r of coreRows.filter((x) => x.status_short === 'HT')) {
    // Kuyruktaki işler henüz istek atmadı: her biri 1 istek harcayacağı için rezerv birikimli sınanır
    // (kalan 8'de 4 maç aynı anda HT'ye girerse yalnız 1'i kuyruğa girer; 6'lık rezerv korunur).
    if (!hasQuotaForOptional(halftimeQueued + 1)) break;
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
    .select('fixture_id, kickoff_at')
    .eq('sport_type', 'football')
    .in('status_short', LIVE);
  if (error) throw error;
  const goneRows = (dbLive ?? []).filter((r) => !liveIds.has(r.fixture_id as number));
  const gone = goneRows.map((r) => r.fixture_id as number);

  // 2a) Durum düzeltme: ücretsiz planda detay çalıştırma başına MAX_SINGLE_FETCH maçla sınırlı.
  //     Aynı anda çok maç bitince (ya da kota rezervi doluysa) hepsinin durum/skoru başlama günü
  //     başına TEK /fixtures?date= isteğiyle güncellenir (sync-nba ile aynı yöntem). Detay sonra gelir.
  let statusDates = 0;
  let statusFixed = 0;
  if (!PAID && gone.length && (gone.length > MAX_SINGLE_FETCH || !hasQuotaForOptional())) {
    const goneSet = new Set(gone);
    for (const date of uniqueLocalDates(goneRows.map((r) => r.kickoff_at as string), TZ)) {
      if (!hasQuotaForStatus()) break;
      try {
        const rows = (await apiGet(`/fixtures?date=${date}&timezone=${TZ}`, KEY))
          .filter((f) => goneSet.has(f.fixture?.id))
          .map(mapCore);
        statusDates++;
        if (!rows.length) continue;
        const { error: stErr } = await admin.from('matches').upsert(rows, { onConflict: 'fixture_id' });
        if (stErr) throw stErr;
        statusFixed += rows.length;
      } catch (e) {
        console.warn(`[sync-matches] ${date} durum güncellemesi atlandı:`, e instanceof Error ? e.message : e);
      }
    }
  }

  // 2b) Biten ama detayı henüz hiç çekilmemiş son maçlar: tarih sorgusuyla MS olanlar artık "canlı"
  //     listesinde olmadığından detayları sonraki çalıştırmalarda buradan tamamlanır. Ölçüt teaser:
  //     detay çekimi her biten maça yazar (API istatistik vermese de) → aynı maç tekrar tekrar istenmez.
  const { data: pending, error: pendErr } = await admin
    .from('matches')
    .select('fixture_id')
    .eq('sport_type', 'football')
    .in('status_short', FINISHED)
    .is('summary_teaser', null)
    .gte('kickoff_at', new Date(Date.now() - 4 * 3600_000).toISOString())
    .order('kickoff_at', { ascending: false })
    .limit(10);
  if (pendErr) console.warn('[sync-matches] detaysız biten maçlar okunamadı:', pendErr.message);
  const needDetail = [...new Set([...gone, ...(pending ?? []).map((r) => r.fixture_id as number)])];

  // 3) Detaylar (olay, istatistik, kadro). Ücretsiz planda kotayı korumak için yalnızca
  //    yeni biten maçlar; ücretli planda canlı maçlar da (20 maç = 1 istek). Döngü 8 bulgu 7: canlı maç
  //    detayı ücretli planda da isteğe bağlıdır → kalan FOOTBALL_QUOTA_RESERVE_PAID'in (varsayılan 500) altına
  //    inecekse yalnız biten maçlar çekilir (skor/dakika 1. adımdaki canlı listeden gelmeye devam eder).
  const liveDetail = PAID && liveIds.size > 0 && hasQuotaForOptional(Math.ceil((liveIds.size + needDetail.length) / 20));
  if (PAID && liveIds.size > 0 && !liveDetail) console.warn('[sync-matches] kota rezervi korunuyor; canlı maç detayı atlandı');
  const ids = liveDetail ? [...new Set([...liveIds, ...needDetail])] : needDetail;
  const base = { live: liveIds.size, status_dates: statusDates, status_fixed: statusFixed, halftime_queued: halftimeQueued, kickoffs };
  if (!ids.length) return { ...base, finished: 0, quota: lastQuotaRemaining() };
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
  await storeLineupFields(admin, fixtures); // 0013: kadro + puan (ayrı update; throw etmez)
  // Yalnızca biten maçların oyuncu verisi form hafızasına yazılır (canlı veri eksik olabilir)
  await storePlayerRows(fixtures.filter((f) => FINISHED.includes(f.fixture?.status?.short)));

  // 4) Akıllı alarm (yalnız ücretli plan: canlı istatistik + dakikalık senkron gerekir)
  const alerts = PAID ? await runFootballAlerts(rows, LIVE) : 0;
  return { ...base, finished, alerts, quota: lastQuotaRemaining() };
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
