// Döngü 8 (docs/test-raporu.md): 0018 ücretli plan anahtarının kenar durumları — PGlite (WASM PG16).
// Supabase'e / üretime dokunmaz. Taklit şemalar (auth, cron, pg_net, vault, roller) zincir testinden alınır.
// Çalıştırma (proje kökünden):
//   npm i --no-save @electric-sql/pglite@0.2.17 && node supabase/sql-tests/0018_paid_switch.pglite.mjs
// Kapsam: jsonb biçimleri ('"true"', 'null', 1), upsert, DELETE, 0018 tekrar (ücretliyken), GERİ DÖNÜŞ bloğu
// (0018 sonundaki yorum satırları), geri dönüşten sonra 0017 tekrar + istemcinin eski api_paid() yedeği,
// service_role / authenticated yetkileri ve sync-matches ikinci emniyetinin ücretli takvimle kesişimi.
// Döngü 8 (geliştirici): zincir 0019'u da uygular. Bulgu 3: DB ücretli + secret kapalı → fikstür yine çalışır
// (cron takvimi × syncUtils.shouldRunSync). Bulgu 4: DELETE → ücretsiz takvim. Bulgu 5: ücretliye geçişte tek
// fikstür çağrısı kuyruğa alınır (net.http_post kaydı), ücretsize dönüşte / aynı değerde alınmaz.
import { PGlite } from '@electric-sql/pglite';
import { readFileSync, readdirSync } from 'node:fs';

const DIR = new URL('../migrations/', import.meta.url);
const files = readdirSync(DIR).filter((f) => /^\d{4}_.*\.sql$/.test(f)).sort();
const chainSrc = readFileSync(new URL('./chain_0001_0017.pglite.mjs', import.meta.url), 'utf8');
const STUB = chainSrc.match(/const STUB = `([\s\S]*?)`;/)[1];
const prep = (sql) => sql.replace(/create extension if not exists (pg_cron|pg_net)[^;]*;/gi, '-- (stub) $&');
const read = (f) => prep(readFileSync(new URL(f, DIR), 'utf8'));
let fails = 0;

const db = new PGlite();
await db.exec(STUB);
// pg_net çağrılarını kaydet (bulgu 5) + call_edge_function'ın okuduğu vault secret'ları
await db.exec(`
create table net.calls (id serial primary key, url text, body jsonb);
create or replace function net.http_post(url text, body jsonb default '{}'::jsonb, params jsonb default '{}'::jsonb,
  headers jsonb default '{}'::jsonb, timeout_milliseconds int default 5000) returns bigint language sql as
  $$ insert into net.calls (url, body) values (url, body) returning id::bigint $$;
insert into vault.secrets values ('project_url', 'https://x.supabase.co'), ('internal_secret', 's');`);
for (const f of files) await db.exec(read(f));
const calls = async () => (await run(null, `select url, body from net.calls order by id`));
const clearCalls = () => run(null, 'delete from net.calls');
const SCHED_PAID = { mode: 'schedule', cadence: 'paid' };

async function run(role, sql) {
  await db.exec(`reset role;${role ? ` set role ${role};` : ''}`);
  try {
    return (await db.query(sql)).rows;
  } catch (e) {
    return 'ERR ' + e.message;
  } finally {
    await db.exec('reset role;');
  }
}
function expect(label, got, test) {
  const ok = test(got);
  if (!ok) fails++;
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${label.padEnd(64)} ${JSON.stringify(got).slice(0, 150)}`);
}
const sched = async () =>
  Object.fromEntries((await run(null, `select jobname, schedule from cron.job where jobname like 'skor-sync-%'`)).map((r) => [r.jobname, r.schedule]));
const isPaid = (s) => s['skor-sync-live'] === '* 9-23 * * *' && s['skor-sync-schedule'] === '0 3,15 * * *';
const isFree = (s) => s['skor-sync-live'] === '*/30 12-22 * * *' && s['skor-sync-schedule'] === '0 9 * * *';
const setPaid = (v) => run(null, `update public.app_config set value = ${v}, updated_at = now() where key = 'api_paid'`);

// 1) jsonb biçimleri
expect('başlangıç: ücretsiz takvim', await sched(), isFree);
expect('0019 kurulumu çağrı kuyruğa almaz (api_paid false)', await calls(), (g) => g.length === 0);
expect(`'"true"' (metin jsonb) → hata, işlem geri alınır`, await setPaid(`'"true"'::jsonb`), (g) => typeof g === 'string' && g.includes('cannot cast'));
expect('… takvim ücretsiz kaldı', await sched(), isFree);
expect(`'1' (sayı jsonb) → hata`, await setPaid(`'1'::jsonb`), (g) => typeof g === 'string' && g.startsWith('ERR'));
expect(`'null' jsonb → ücretsiz (coalesce)`, (await setPaid(`'null'::jsonb`), await sched()), isFree);
await setPaid(`'false'::jsonb`);

// 2) aynı değeri yeniden yazmak no-op; true → ücretli; tekrar true → değişmez
await clearCalls();
await setPaid(`'true'::jsonb`);
expect('BULGU 5: ücretliye geçiş fikstürü bir kez kuyruğa alır', await calls(),
  (g) => g.length === 1 && g[0].url.endsWith('/functions/v1/sync-matches') && JSON.stringify(g[0].body) === JSON.stringify(SCHED_PAID));
const idsBefore = await run(null, `select jobid from cron.job where jobname like 'skor-sync-%' order by 1`);
await setPaid(`'true'::jsonb`);
const idsAfter = await run(null, `select jobid from cron.job where jobname like 'skor-sync-%' order by 1`);
expect('true → ücretli takvim', await sched(), isPaid);
expect('aynı değer (true→true) işleri yeniden kurmaz', [idsBefore, idsAfter], ([a, b]) => JSON.stringify(a) === JSON.stringify(b));
expect('… ve ikinci fikstür çağrısı yok', await calls(), (g) => g.length === 1);

// 3) 0018 ücretliyken tekrar → ücretli kalır, iş tekil; ardından 0019 tekrar (başlık notu)
await clearCalls();
await db.exec(read(files.find((f) => f.startsWith('0018_'))));
expect('0018 tekrar (ücretliyken): ücretli kalır', await sched(), isPaid);
await db.exec(read(files.find((f) => f.startsWith('0019_'))));
expect('0019 tekrar (ücretliyken): ücretli kalır, çağrı yok', [await sched(), await calls()], ([s, c]) => isPaid(s) && c.length === 0);
expect('0018 tekrar: api_paid değeri korunur', await run(null, `select value from public.app_config where key='api_paid'`), (g) => g[0].value === true);

// 4) DELETE (bulgu 4, 0019): satır silinince takvim ücretsize döner; istemci de ücretsiz → tutarlı
await run(null, `delete from public.app_config where key = 'api_paid'`);
const afterDelete = await sched();
expect('BULGU 4: api_paid satırı silinince cron ücretsiz takvime döner', afterDelete, isFree);
expect('… istemci api_paid_for(football) = false', await run(null, `select public.api_paid_for('football') f`), (g) => g[0].f === false);
expect('… gövdede cadence yok (0004 ile aynı)', await run(null, `select count(*)::int n from cron.job where jobname like 'skor-sync-%' and command like '%cadence%'`), (g) => g[0].n === 0);
expect('… silme çağrı kuyruğa almaz', await calls(), (g) => g.length === 0);
await run(null, `delete from public.app_config where key = 'nba_api_paid_yok'`); // başka anahtar: tetikleyici sessiz
expect('başka anahtar silmek takvimi değiştirmez', await sched(), isFree);
// Upsert (insert … on conflict) yeniden ekleme: INSERT yolu tetikler
await run(null, `insert into public.app_config (key, value) values ('api_paid', 'false'::jsonb) on conflict (key) do update set value = excluded.value`);
expect('upsert ile false eklenince ücretsiz takvim', await sched(), isFree);
expect('… false eklemek çağrı kuyruğa almaz', await calls(), (g) => g.length === 0);
await run(null, `insert into public.app_config (key, value) values ('api_paid', 'true'::jsonb) on conflict (key) do update set value = excluded.value`);
expect('upsert (update yolu) true → ücretli', await sched(), isPaid);
expect('… ve fikstür bir kez kuyruğa alındı', await calls(), (g) => g.length === 1);
// Ücretsize dönüş (R1) çağrı almaz; ücretliye yeniden geçiş yine bir kez alır
await clearCalls();
await setPaid(`'false'::jsonb`);
expect('R1 ücretsize dönüş: ücretsiz takvim, çağrı yok', [await sched(), await calls()], ([s, c]) => isFree(s) && c.length === 0);
await setPaid(`'true'::jsonb`);
expect('yeniden ücretli: bir çağrı', await calls(), (g) => g.length === 1);
// Silinip INSERT ile doğrudan true eklenirse de (insert yolu) fikstür kuyruğa alınır
await run(null, `delete from public.app_config where key = 'api_paid'`);
await clearCalls();
await run(null, `insert into public.app_config (key, value) values ('api_paid', 'true'::jsonb)`);
expect('DELETE → INSERT true: ücretli + bir çağrı', [await sched(), await calls()], ([s, c]) => isPaid(s) && c.length === 1);
// call_edge_function hata verse de plan geçişi geri alınmaz (uyarı)
await setPaid(`'false'::jsonb`);
await run(null, `alter table net.calls add constraint no_calls check (false)`);
expect('fikstür çağrısı hata verirse güncelleme yine geçer', (await setPaid(`'true'::jsonb`), await sched()), isPaid);
await run(null, `alter table net.calls drop constraint no_calls`);

// 4b) BULGU 3: DB ücretli + secret kapalı → cron takvimi × Edge ikinci emniyeti (syncUtils.ts, node TS)
const { shouldRunSync } = await import('../functions/_shared/syncUtils.ts');
const jobs = await run(null, `select jobname, schedule, command from cron.job where jobname like 'skor-sync-%'`);
const cronHits = (schedule) => {
  // Yalnız bu dosyadaki biçimler: '* 9-23 * * *', '0 3,15 * * *'
  const [min, hour] = schedule.split(' ');
  const hours = hour.includes('-') ? (([a, b]) => Array.from({ length: b - a + 1 }, (_, i) => a + i))(hour.split('-').map(Number)) : hour.split(',').map(Number);
  const out = [];
  for (const h of hours) for (let m = 0; m < 60; m++) if (min === '*' || Number(min) === m) out.push(new Date(Date.UTC(2026, 10, 21, h, m)));
  return out;
};
const runs = Object.fromEntries(jobs.map((j) => {
  const body = JSON.parse(j.command.match(/'(\{.*\})'::jsonb/)[1]);
  return [j.jobname, cronHits(j.schedule).filter((at) => shouldRunSync({ ...body, paid: false, now: at })).length];
}));
expect('BULGU 3: DB ücretli + secret kapalı: canlı 22/gün, fikstür 2/gün', runs, (g) => g['skor-sync-live'] === 22 && g['skor-sync-schedule'] === 2);

// 5) Yetkiler: istemci rolleri app_config'e yazamaz, plan fonksiyonlarını çağıramaz
expect('authenticated app_config güncelleyemez (RLS, 0 satır)',
  await run('authenticated', `update public.app_config set value = 'false'::jsonb where key = 'api_paid' returning key`),
  (g) => Array.isArray(g) ? g.length === 0 : g.includes('permission denied'));
expect('… takvim hâlâ ücretli', await sched(), isPaid);
for (const fn of ['apply_football_sync_schedule()', 'invite_recount_held()', 'invite_try_activate(null::uuid)']) {
  expect(`anon çağıramaz: ${fn}`, await run('anon', `select public.${fn}`), (g) => typeof g === 'string' && g.includes('permission denied'));
}
expect('api_paid_for(nba) bozuk değerde hata (istemci null → ücretsiz metin)',
  (await run(null, `update public.app_config set value = '"x"'::jsonb where key = 'nba_api_paid'`),
  await run('authenticated', `select public.api_paid_for('nba')`)),
  (g) => typeof g === 'string' && g.startsWith('ERR'));
await run(null, `update public.app_config set value = 'false'::jsonb where key = 'nba_api_paid'`);

// 6) GERİ DÖNÜŞ bloğu (0018 sonundaki yorumlar, sırasıyla) — ücretliyken
const rb = readFileSync(new URL(files.find((f) => f.startsWith('0018_')), DIR), 'utf8')
  .split('-- ─────────────────────────────────────────────── GERİ DÖNÜŞ')[1]
  .split('\n')
  .filter((l) => /^--\s{3}(drop|update|select|delete)/.test(l))
  .map((l) => l.replace(/^--\s{3}/, '').replace(/\s+--.*$/, ''))
  .filter((l) => !/0017_growth_invites|invite_try_activate/.test(l));
expect('geri dönüş bloğu satır sayısı', rb.length, (n) => n >= 8);
let rbErr = null;
for (const stmt of rb) {
  const r = await run(null, stmt).then((x) => x);
  if (typeof r === 'string') rbErr = `${stmt} → ${r}`;
}
expect('geri dönüş bloğu hatasız', rbErr, (g) => g === null);
expect('geri dönüş sonrası: ücretsiz takvim', await sched(), isFree);
expect('geri dönüş sonrası: skor-invite-recount yok', await run(null, `select count(*)::int n from cron.job where jobname='skor-invite-recount'`), (g) => g[0].n === 0);
expect('geri dönüş sonrası: api_paid tetikleyicisi yok', await run(null, `select count(*)::int n from pg_trigger where tgname='app_config_api_paid_schedule'`), (g) => g[0].n === 0);
// 0017 tekrar → touch_activity 0017 sürümüne döner; sonra invite_try_activate düşürülebilir
const r17 = await db.exec(read(files.find((f) => f.startsWith('0017_')))).then(() => 'ok', (e) => e.message);
expect('geri dönüş: 0017 tekrar çalışır', r17, (g) => g === 'ok');
expect('geri dönüş: invite_try_activate düşürülür', await run(null, `drop function if exists public.invite_try_activate(uuid)`), Array.isArray);
expect('geri dönüş: touch_activity / get_my_invite hâlâ derlenir (bağımlılık yok)',
  await run(null, `select count(*)::int n from pg_proc where proname in ('touch_activity','get_my_invite','redeem_invite') and prosrc like '%invite_try_activate%'`),
  (g) => g[0].n === 0);
expect('geri dönüş: istemci yedeği api_paid() (0015) duruyor', await run('authenticated', `select public.api_paid() p`), (g) => Array.isArray(g) && g[0].p === false);
// Geri dönüşten sonra 0018 yeniden uygulanabilir
const re18 = await db.exec(read(files.find((f) => f.startsWith('0018_')))).then(() => 'ok', (e) => e.message);
expect('geri dönüş sonrası 0018 yeniden uygulanır', re18, (g) => g === 'ok');
expect('… ve ücretsiz takvimde başlar', await sched(), isFree);
// 0019 de yeniden uygulanır; ardından 0019 GERİ DÖNÜŞ satırları (fixture_days_ahead) hatasız
const re19 = await db.exec(read(files.find((f) => f.startsWith('0019_')))).then(() => 'ok', (e) => e.message);
expect('0019 yeniden uygulanır (ücretsiz takvim, çağrı yok)', [re19, await sched()], ([r, s]) => r === 'ok' && isFree(s));
const rb19 = readFileSync(new URL(files.find((f) => f.startsWith('0019_')), DIR), 'utf8')
  .split('-- ─────────────────────────────────────────────── GERİ DÖNÜŞ')[1]
  .split('\n')
  .filter((l) => /^--\s{3}(drop|delete)/.test(l))
  .map((l) => l.replace(/^--\s{3}/, '').replace(/\s+--.*$/, ''));
let rb19Err = null;
for (const stmt of rb19) {
  const r = await run(null, stmt);
  if (typeof r === 'string') rb19Err = `${stmt} → ${r}`;
}
expect('0019 geri dönüş satırları (2) hatasız', [rb19.length, rb19Err], ([n, e]) => n === 2 && e === null);
expect('… fixture_days_ahead kalktı', await run(null, `select count(*)::int n from pg_proc where proname = 'fixture_days_ahead'`), (g) => g[0].n === 0);

console.log(fails ? `\n${fails} hata` : '\nTümü geçti');
process.exit(fails ? 1 : 0);
