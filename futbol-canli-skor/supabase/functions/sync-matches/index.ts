// pg_cron ile çağrılır (bkz. 0002_pipeline.sql):
//   mode=live     → canlı maçların skor/dakika/olay/istatistikleri + yeni bitenler
//   mode=schedule → dün/bugün/yarın fikstürü + biten maçların istatistikleri
import { apiGet, getFixturesByIds, isTracked, mapCore, mapDetails } from '../_shared/apiFootball.ts';
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
      const details = (await getFixturesByIds(ids, KEY)).map((f) => {
        const row: Partial<MatchRow> = { ...mapCore(f), ...mapDetails(f) };
        row.summary_teaser = buildTeaser(row as MatchRow);
        return row;
      });
      const { error: upErr } = await admin.from('matches').upsert(details, { onConflict: 'fixture_id' });
      if (upErr) throw upErr;
      enriched = details.length;
    }
  }
  return { scheduled: count, enriched, skipped };
}

async function syncLive() {
  // 1) Şu an canlı olan takip edilen maçlar (1 istek)
  const liveIds = (await apiGet('/fixtures?live=all', KEY)).filter(isTracked).map((f) => f.fixture.id as number);

  // 2) DB'de hâlâ canlı görünen ama listeden düşenler = yeni bitenler (veya ertelenenler)
  const { data: dbLive, error } = await admin.from('matches').select('fixture_id').in('status_short', LIVE);
  if (error) throw error;
  const ids = [...new Set([...liveIds, ...(dbLive ?? []).map((r) => r.fixture_id as number)])];
  if (!ids.length) return { live: 0, finished: 0 };

  // 3) Detaylar: her 20 maç için 1 istek
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

  // Değişmeyen satırları yazmamak Realtime trafiğini azaltır, ama basitlik için upsert.
  const { error: upErr } = await admin.from('matches').upsert(rows, { onConflict: 'fixture_id' });
  if (upErr) throw upErr;
  return { live: liveIds.length, finished };
}
