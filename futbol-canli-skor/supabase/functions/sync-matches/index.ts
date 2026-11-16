// pg_cron ile çağrılır (bkz. 0002_pipeline.sql):
//   mode=live     → her dakika: canlı maçların skor/dakika/olay/istatistikleri + yeni bitenler
//   mode=schedule → 30 dakikada bir: bugün ve yarının fikstürü
import { apiGet, getFixturesByIds, isTracked, mapCore, mapDetails } from '../_shared/apiFootball.ts';
import { admin, authorized, json } from '../_shared/supabaseAdmin.ts';
import { buildTeaser } from '../_shared/teaser.ts';
import { FINISHED, LIVE, type MatchRow } from '../_shared/types.ts';

const KEY = Deno.env.get('API_FOOTBALL_KEY')!;
const TZ = 'Europe/Istanbul';

Deno.serve(async (req) => {
  if (!authorized(req)) return json({ error: 'unauthorized' }, 401);
  const { mode = 'live' } = await req.json().catch(() => ({}));
  try {
    const result = mode === 'schedule' ? await syncSchedule() : await syncLive();
    return json({ ok: true, ...result });
  } catch (e) {
    console.error('[sync-matches]', e);
    return json({ ok: false, error: e instanceof Error ? e.message : String(e) }, 500);
  }
});

async function syncSchedule() {
  const day = (offset: number) => new Date(Date.now() + offset * 86400_000).toLocaleDateString('en-CA', { timeZone: TZ });
  let count = 0;
  for (const date of [day(0), day(1)]) {
    const rows = (await apiGet(`/fixtures?date=${date}&timezone=${TZ}`, KEY)).filter(isTracked).map(mapCore);
    if (rows.length) {
      const { error } = await admin.from('matches').upsert(rows, { onConflict: 'fixture_id' });
      if (error) throw error;
    }
    count += rows.length;
  }
  return { scheduled: count };
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
