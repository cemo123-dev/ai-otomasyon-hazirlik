// Tüm migration zinciri (0001 → 0017) gerçek Postgres (PGlite, WASM PG16) üzerinde sırayla derlenir.
// Supabase'e / üretime dokunmaz. auth, cron, pg_net, vault, roller ve supabase_realtime yayını taklit edilir.
// Çalıştırma (proje kökünden):
//   npm i --no-save @electric-sql/pglite@0.2.17 && node supabase/sql-tests/chain_0001_0017.pglite.mjs
// Döngü 7 (docs/test-raporu.md): 0015 → 0016 → 0017 sırası, tekrar çalıştırma (idempotent) ve
// 0017'nin "0016'dan önce ya da sonra çalıştırılabilir" iddiası (0017 → 0016 sırası) ayrı veritabanlarında denenir.
// Döngü 7 geliştirici (GELISTIRMELER 3.34): dosya adı korunarak 0018 de zincire girdi (klasördeki tüm
// migration'lar okunur) + bölüm 6: 0018 plan/cron davranışı ve davet düzeltmeleri (bulgu 5–8).
// Döngü 8: zincir 0001 → 0019 (0019_paid_switch_safety); tekrar 0015–0019; bölüm 6h: 0019 (DELETE, gün sayısı).
import { PGlite } from '@electric-sql/pglite';
import { readFileSync, readdirSync } from 'node:fs';

const DIR = new URL('../migrations/', import.meta.url);
const files = readdirSync(DIR).filter((f) => /^\d{4}_.*\.sql$/.test(f)).sort();
let fails = 0;

const STUB = `
create role anon nologin; create role authenticated nologin; create role service_role nologin;
create schema auth;
create table auth.users (id uuid primary key, email text, created_at timestamptz default now());
create function auth.uid() returns uuid language sql stable as
  $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create function auth.role() returns text language sql stable as
  $$ select coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), 'anon') $$;
create function auth.jwt() returns jsonb language sql stable as $$ select '{}'::jsonb $$;
grant usage on schema auth to anon, authenticated, service_role;
grant execute on all functions in schema auth to anon, authenticated, service_role;
grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
create schema cron;
create table cron.job (jobid serial primary key, jobname text unique, schedule text, command text, active boolean default true);
create function cron.schedule(n text, s text, c text) returns bigint language sql as $$
  insert into cron.job (jobname, schedule, command) values (n, s, c)
  on conflict (jobname) do update set schedule = excluded.schedule, command = excluded.command returning jobid::bigint $$;
create function cron.unschedule(n text) returns boolean language sql as
  $$ delete from cron.job where jobname = n returning true $$;
create function cron.unschedule(id bigint) returns boolean language sql as
  $$ delete from cron.job where jobid = id returning true $$;
create function cron.alter_job(job_id bigint, schedule text default null, command text default null,
  database text default null, username text default null, active boolean default null) returns void language sql as
  $$ update cron.job set schedule = coalesce(alter_job.schedule, cron.job.schedule),
       command = coalesce(alter_job.command, cron.job.command), active = coalesce(alter_job.active, cron.job.active)
     where jobid = job_id $$;
create schema net;
create function net.http_post(url text, body jsonb default '{}'::jsonb, params jsonb default '{}'::jsonb,
  headers jsonb default '{}'::jsonb, timeout_milliseconds int default 5000) returns bigint language sql as $$ select 1::bigint $$;
create function net.http_get(url text, params jsonb default '{}'::jsonb, headers jsonb default '{}'::jsonb,
  timeout_milliseconds int default 5000) returns bigint language sql as $$ select 1::bigint $$;
create schema vault;
create table vault.secrets (name text primary key, secret text);
create view vault.decrypted_secrets as select name, secret as decrypted_secret from vault.secrets;
create function vault.create_secret(s text, n text) returns uuid language sql as
  $$ insert into vault.secrets values (n, s) returning gen_random_uuid() $$;
create schema extensions;
create function extensions.gen_random_bytes(n int) returns bytea language sql volatile as
  $$ select substring(decode(md5(random()::text) || md5(random()::text) || md5(random()::text) || md5(random()::text), 'hex') from 1 for n) $$;
create schema storage;
create table storage.buckets (id text primary key, name text, public boolean default false, file_size_limit bigint, allowed_mime_types text[]);
create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text, owner uuid);
create publication supabase_realtime;
`;

// pg_cron / pg_net uzantıları PGlite'ta yok: "create extension" satırları taklit şemalar varken atlanır.
const prep = (sql) => sql.replace(/create extension if not exists (pg_cron|pg_net)[^;]*;/gi, '-- (stub) $&');

async function applyAll(order, label) {
  const db = new PGlite();
  await db.exec(STUB);
  for (const f of order) {
    const sql = prep(readFileSync(new URL(f, DIR), 'utf8'));
    const r = await db.exec(sql).then(() => 'ok', (e) => e.message);
    const ok = r === 'ok';
    if (!ok) fails++;
    console.log(`${ok ? 'OK  ' : 'FAIL'} ${label.padEnd(10)} ${f.padEnd(34)} ${ok ? '' : r.slice(0, 200)}`);
    if (!ok) return db;
  }
  return db;
}

// 1) Tam zincir sırayla
const db = await applyAll(files, 'zincir');
// 2) 0015–0019 ikinci kez (idempotent)
if (!files.some((x) => /^0019_/.test(x))) fails++;
for (const f of files.filter((x) => /^(001[5-9])_/.test(x))) {
  const r = await db.exec(prep(readFileSync(new URL(f, DIR), 'utf8'))).then(() => 'ok', (e) => e.message);
  if (r !== 'ok') fails++;
  console.log(`${r === 'ok' ? 'OK  ' : 'FAIL'} ${'tekrar'.padEnd(10)} ${f.padEnd(34)} ${r === 'ok' ? '' : r.slice(0, 200)}`);
}
// 3) cron işleri: her ad tek, 0017 temizliği kayıtlı
const jobs = (await db.query('select jobname, count(*)::int n from cron.job group by jobname order by 1')).rows;
const dup = jobs.filter((j) => j.n !== 1);
if (dup.length || !jobs.some((j) => j.jobname === 'skor-growth-cleanup')) fails++;
console.log(`${dup.length ? 'FAIL' : 'OK  '} cron işleri tekil (${jobs.length}): ${jobs.map((j) => j.jobname).join(', ')}`);
// 4) Zincir sonunda 0017 fonksiyonları security definer + search_path = '' (yetki yükseltme yüzeyi)
const defs = (await db.query(`select proname, prosecdef, proconfig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and prosecdef and not coalesce(proconfig::text like '%search_path=%', false)`)).rows;
if (defs.length) fails++;
console.log(`${defs.length ? 'FAIL' : 'OK  '} search_path'siz security definer yok ${JSON.stringify(defs.map((d) => d.proname))}`);
// 5) 0017 → 0016 sırası (başlık iddiası: 0016'ya bağımlı değil); 0018+ en sonda (0017'ye bağımlı)
const early = files.filter((x) => x < '0016');
const late = files.filter((x) => x >= '0018');
const rev = early.concat(files.filter((x) => /^0017_/.test(x)), files.filter((x) => /^0016_/.test(x)), late);
await applyAll(rev, '17→16');

// 6) 0018 (Pro API hazırlığı + Döngü 7 davet düzeltmeleri) davranışı — zincir veritabanında
const U = (n) => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;
async function run(role, uid, sql) {
  await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${uid ?? ''}', false);${role ? ` set role ${role};` : ''}`);
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
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${label.padEnd(52)} ${JSON.stringify(got).slice(0, 140)}`);
}
const denied = (g) => typeof g === 'string' && g.includes('permission denied');
const job = async (n) => (await run(null, null, `select schedule, command from cron.job where jobname = '${n}'`))[0];
const FREE_LIVE = ` select public.call_edge_function('sync-matches', '{"mode":"live"}'::jsonb) `;
const FREE_SCHED = ` select public.call_edge_function('sync-matches', '{"mode":"schedule"}'::jsonb) `;
const otherJobs = async () =>
  JSON.stringify(await run(null, null, `select jobname, schedule, command from cron.job where jobname like 'nba-%' or jobname = 'skor-sync-cleanup' order by 1`));

// 6a) plan bilgisi spor başına
expect('api_paid_for: futbol / nba / bilinmeyen = false',
  await run('authenticated', U(1), `select public.api_paid_for('football') f, public.api_paid_for('nba') n, public.api_paid_for('x') x`),
  (g) => Array.isArray(g) && g[0].f === false && g[0].n === false && g[0].x === false);
expect('api_paid_for: anon kapalı', await run('anon', null, `select public.api_paid_for('football')`), denied);
expect('nba_api_paid satırı false', await run(null, null, `select value from public.app_config where key = 'nba_api_paid'`), (g) => g[0]?.value === false);

// 6b) ücretsiz planda takvim 0004 ile BİREBİR (istek sayısı artmaz)
const before = await otherJobs();
expect('ücretsiz: skor-sync-live */30 12-22, gövde 0004 ile aynı', await job('skor-sync-live'),
  (g) => g?.schedule === '*/30 12-22 * * *' && g.command === FREE_LIVE);
expect('ücretsiz: skor-sync-schedule 0 9, gövde 0004 ile aynı', await job('skor-sync-schedule'),
  (g) => g?.schedule === '0 9 * * *' && g.command === FREE_SCHED);

// 6c) api_paid true → dakikalık + cadence 'paid'; NBA ve gece temizliği değişmez
await run(null, null, `update public.app_config set value = 'true'::jsonb where key = 'api_paid'`);
expect('ücretli: skor-sync-live * 9-23 + cadence paid', await job('skor-sync-live'),
  (g) => g?.schedule === '* 9-23 * * *' && g.command.includes('"cadence":"paid"'));
expect('ücretli: skor-sync-schedule 0 3,15 + cadence paid', await job('skor-sync-schedule'),
  (g) => g?.schedule === '0 3,15 * * *' && g.command.includes('"cadence":"paid"'));
expect('ücretli: api_paid_for football true, nba false',
  await run('authenticated', U(1), `select public.api_paid_for('football') f, public.api_paid_for('nba') n`),
  (g) => g[0]?.f === true && g[0]?.n === false);
expect('NBA işleri ve skor-sync-cleanup değişmedi', await otherJobs(), (g) => g === before);
const F18 = files.find((x) => /^0018_/.test(x));
const F19 = files.find((x) => /^0019_/.test(x));
await db.exec(prep(readFileSync(new URL(F18, DIR), 'utf8')));
await db.exec(prep(readFileSync(new URL(F19, DIR), 'utf8'))); // 0018 tekrarından sonra 0019 da (başlık notu)
expect('ücretliyken 0018 tekrar: takvim ücretli kalır', await job('skor-sync-live'), (g) => g?.schedule === '* 9-23 * * *');
// Geri dönüş: tek update
await run(null, null, `update public.app_config set value = 'false'::jsonb where key = 'api_paid'`);
expect('geri dönüş: takvim 0004 ile birebir', [await job('skor-sync-live'), await job('skor-sync-schedule')],
  (g) => g[0]?.schedule === '*/30 12-22 * * *' && g[0].command === FREE_LIVE && g[1]?.schedule === '0 9 * * *' && g[1].command === FREE_SCHED);
const jobs2 = (await db.query('select jobname, count(*)::int n from cron.job group by jobname')).rows;
expect('cron işleri tekil, skor-invite-recount kayıtlı', jobs2,
  (g) => g.every((j) => j.n === 1) && g.some((j) => j.jobname === 'skor-invite-recount'));
for (const fn of ['apply_football_sync_schedule()', 'invite_try_activate(null::uuid)', 'invite_recount_held()']) {
  expect(`authenticated çağıramaz: ${fn}`, await run('authenticated', U(1), `select public.${fn}`), denied);
}

// 6d) Bulgu 5: silinmiş hesabın süresi dolmamış oturumu → hata yok
const D = U(500);
// run() tek ifade çalıştırır (db.query): ekleme ve silme ayrı
await run(null, null, `insert into auth.users (id) values ('${D}')`);
expect('silinecek hesabın profili var (0001 tetikleyicisi)', await run(null, null, `select count(*)::int n from public.profiles where id = '${D}'`), (g) => g[0]?.n === 1);
await run('authenticated', D, 'select public.touch_activity()');
await run(null, null, `delete from auth.users where id = '${D}'`);
expect('silinmiş hesap: touch_activity hata vermez', await run('authenticated', D, 'select public.touch_activity()'), (g) => Array.isArray(g));
expect('silinmiş hesap: get_my_invite satır döndürmez', await run('authenticated', D, 'select * from public.get_my_invite()'),
  (g) => Array.isArray(g) && g.length === 0);
expect('silinmiş hesap: redeem_invite unauthenticated', await run('authenticated', D, `select public.redeem_invite('ABCDEF') r`),
  (g) => Array.isArray(g) && g[0]?.r === 'unauthenticated');
expect('silinmiş hesap: profil / gün satırı yazılmadı',
  await run(null, null, `select (select count(*) from public.profiles where id = '${D}')::int p, (select count(*) from public.user_activity_days where user_id = '${D}')::int d`),
  (g) => g[0]?.p === 0 && g[0]?.d === 0);

// 6e) Bulgu 6: 3'lü halka engelli, zincir (halka olmayan) serbest
const [A, B, C, E] = [U(601), U(602), U(603), U(604)];
await run(null, null, `insert into auth.users (id) values ('${A}'), ('${B}'), ('${C}'), ('${E}')`);
const code = async (u) => (await run('authenticated', u, 'select code from public.get_my_invite()'))[0]?.code;
const redeem = async (u, c) => (await run('authenticated', u, `select public.redeem_invite('${c}') r`))[0]?.r;
const [cA, cB, cC] = [await code(A), await code(B), await code(C)];
expect('B ← A kodu', await redeem(B, cA), (g) => g === 'ok');
expect('C ← B kodu', await redeem(C, cB), (g) => g === 'ok');
expect("A ← C kodu: 3'lü halka not_allowed", await redeem(A, cC), (g) => g === 'not_allowed');
expect('E ← C kodu: halka değil, ok', await redeem(E, cC), (g) => g === 'ok');
expect("A'nın kod girme hakkı duruyor (hata sayılmadı)", await run(null, null, `select invited_at, invite_fail_count from public.profiles where id = '${A}'`),
  (g) => g[0]?.invited_at === null && g[0]?.invite_fail_count === 0);

// 6f) Bulgu 7: lider tablosu 4 karakter önek
expect('lider tablosu öneki 4 karakter', await run(null, null, 'select * from public.admin_invite_leaderboard()'),
  (g) => Array.isArray(g) && g.length > 0 && g.every((r) => r.code_prefix.length === 4));

// 6g) Bulgu 8: sınırda bekleyen davetli saatlik turda sayılır (uygulamayı yeniden açmasa da)
const I = U(700);
const inv = [1, 2, 3, 4, 5, 6].map((i) => U(700 + i));
await run(null, null, `insert into auth.users (id) values ('${I}'), ${inv.map((u) => `('${u}')`).join(', ')}`);
const cI = await code(I);
const redeemed = []; for (const u of inv) redeemed.push(await redeem(u, cI));
expect('6 davetli I kodunu girdi', redeemed, (g) => g.every((r) => r === 'ok'));
// Kod 4 gün önce girilmiş; kod gününden sonra 2 gün arayla aktif (bugün + 2 gün önce)
await run(null, null, `update public.profiles set invited_at = now() - interval '4 days' where invited_by = '${I}'`);
await run(null, null, `insert into public.user_activity_days (user_id, day)
  select id, (now() at time zone 'Europe/Istanbul')::date - 2 from public.profiles where invited_by = '${I}'
  on conflict do nothing;`);
for (const u of inv) await run('authenticated', u, 'select public.touch_activity()');
const activeCount = async () =>
  (await run(null, null, `select count(*)::int n from public.profiles where invited_by = '${I}' and invite_active_at is not null`))[0]?.n;
expect('sınır: 6 uygun davetliden 5 aktif', await activeCount(), (g) => g === 5);
expect('sınır dolu: saatlik tur kimseyi eklemez', (await run(null, null, 'select public.invite_recount_held() n'))[0]?.n, (g) => g === 0);
await run(null, null, `update public.profiles set invite_active_at = now() - interval '25 hours' where invited_by = '${I}' and invite_active_at is not null`);
expect('24 saat sonra saatlik tur bekleyeni sayar', (await run(null, null, 'select public.invite_recount_held() n'))[0]?.n, (g) => g === 1);
expect('6 davetlinin hepsi aktif', await activeCount(), (g) => g === 6);
expect('tekdüze: tekrar tur kimseyi değiştirmez', (await run(null, null, 'select public.invite_recount_held() n'))[0]?.n, (g) => g === 0);

// 6h) 0019 (Döngü 8): fikstür gün sayısı tek kaynak, tetikleyici DELETE'i dinler
expect('0019: fixture_days_ahead varsayılan 7', await run('authenticated', U(1), 'select public.fixture_days_ahead() n'), (g) => Array.isArray(g) && g[0].n === 7);
expect('0019: fixture_days_ahead anon kapalı', await run('anon', null, 'select public.fixture_days_ahead()'), denied);
await run(null, null, `update public.app_config set value = '3'::jsonb where key = 'fixture_days_ahead'`);
expect('0019: fixture_days_ahead 3', (await run(null, null, 'select public.fixture_days_ahead() n'))[0]?.n, (g) => g === 3);
await run(null, null, `update public.app_config set value = '"5"'::jsonb where key = 'fixture_days_ahead'`);
expect('0019: sayı olmayan değer → 7 (hata yok)', (await run(null, null, 'select public.fixture_days_ahead() n'))[0]?.n, (g) => g === 7);
await run(null, null, `update public.app_config set value = '40'::jsonb where key = 'fixture_days_ahead'`);
expect('0019: 40 → 7 (kırpılır)', (await run(null, null, 'select public.fixture_days_ahead() n'))[0]?.n, (g) => g === 7);
await run(null, null, `update public.app_config set value = '7'::jsonb where key = 'fixture_days_ahead'`);
expect('0019: tetikleyici insert/update/delete', await run(null, null,
  `select (tgtype & 4) > 0 i, (tgtype & 8) > 0 d, (tgtype & 16) > 0 u from pg_trigger where tgname = 'app_config_api_paid_schedule'`),
  (g) => g[0]?.i === true && g[0]?.d === true && g[0]?.u === true);
expect('0019: on_api_paid_change authenticated çağıramaz', await run('authenticated', U(1), 'select public.on_api_paid_change()'),
  (g) => typeof g === 'string');

console.log(fails ? `\n${fails} BAŞARISIZ` : '\nTümü geçti');
process.exit(fails ? 1 : 0);
