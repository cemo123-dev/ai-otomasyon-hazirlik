// 0017_growth_invites.sql — gerçek Postgres (PGlite, WASM PG16) üzerinde derleme + yetki + akış testi.
// Supabase'e / üretime dokunmaz. auth, cron ve roller (anon / authenticated / service_role) taklit edilir.
// Çalıştırma (proje kökünden):
//   npm i --no-save @electric-sql/pglite@0.2.17 && node supabase/sql-tests/0017_growth_invites.pglite.mjs
// Döngü 6 (docs/test-raporu.md). "DÜZELTME" etiketli kontroller Döngü 6 bulgularının düzeltilmiş davranışını doğrular.
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';

const MIG = new URL('../migrations/0017_growth_invites.sql', import.meta.url);
const db = new PGlite();
let fails = 0;

const STUB = `
create role anon nologin; create role authenticated nologin; create role service_role nologin;
create schema auth;
create table auth.users (id uuid primary key, created_at timestamptz default now());
create function auth.uid() returns uuid language sql stable as
  $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema auth to anon, authenticated; grant execute on function auth.uid() to anon, authenticated;
grant usage on schema public to anon, authenticated;
-- Supabase varsayılanı: yeni tablo / fonksiyon istemci rollerine açık doğar
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
create schema cron;
create table cron.job (jobid serial, jobname text unique, schedule text, command text);
create function cron.schedule(n text, s text, c text) returns bigint language sql as $$
  insert into cron.job (jobname, schedule, command) values (n, s, c)
  on conflict (jobname) do update set schedule = excluded.schedule, command = excluded.command returning jobid::bigint $$;
create function cron.unschedule(n text) returns boolean language sql as
  $$ delete from cron.job where jobname = n returning true $$;
-- 0001'den profiles + tetikleyici (birebir)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  is_premium boolean not null default false,
  subscription_expires_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "own" on public.profiles for select to authenticated using (id = (select auth.uid()));
create function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as
  $$ begin insert into public.profiles (id) values (new.id) on conflict (id) do nothing; return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
`;

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
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${label.padEnd(46)} ${JSON.stringify(got).slice(0, 140)}`);
}
const denied = (g) => typeof g === 'string' && g.includes('permission denied');
const redeem = (uid, code) => run('authenticated', uid, `select public.redeem_invite(${code === null ? 'null' : `'${code}'`}) r`).then((r) => r[0]?.r ?? r);
const invite = (uid) => run('authenticated', uid, 'select * from public.get_my_invite()').then((r) => r[0] ?? r);

await db.exec(STUB);
const mig = readFileSync(MIG, 'utf8');
expect('migration 1. çalıştırma', await db.exec(mig).then(() => 'ok', (e) => e.message), (g) => g === 'ok');
expect('migration 2. çalıştırma (idempotent)', await db.exec(mig).then(() => 'ok', (e) => e.message), (g) => g === 'ok');
expect('cron işi tek', await run(null, null, 'select jobname from cron.job'), (g) => g.length === 1);

const N = 12;
for (let i = 1; i <= N; i++) await db.exec(`insert into auth.users (id) values ('${U(i)}')`);
await db.exec(`update public.profiles set created_at = now() - interval '10 days' where id = '${U(5)}'`);

// Yetkiler
expect('anon touch_activity', await run('anon', null, 'select public.touch_activity()'), denied);
expect('anon get_my_invite', await run('anon', null, 'select * from public.get_my_invite()'), denied);
expect('anon redeem_invite', await run('anon', null, "select public.redeem_invite('ABC234')"), denied);
expect('auth invite_random_code', await run('authenticated', U(1), 'select public.invite_random_code()'), denied);
expect('auth admin_growth_report', await run('authenticated', U(1), "select public.admin_growth_report('2020-01-01','2030-01-01')"), denied);
expect('auth admin_invite_leaderboard', await run('authenticated', U(1), 'select * from public.admin_invite_leaderboard()'), denied);
expect('auth select user_activity_days', await run('authenticated', U(1), 'select * from public.user_activity_days'), denied);
expect('auth insert user_activity_days', await run('authenticated', U(1), `insert into public.user_activity_days values ('${U(1)}', current_date)`), denied);
expect('auth profiles update (politika yok)', await run('authenticated', U(2), `update public.profiles set invited_by = null where id = '${U(2)}' returning id`), (g) => Array.isArray(g) ? g.length === 0 : denied(g));

// Akış
const a = await invite(U(1));
expect('A kod üretir', a, (g) => /^[A-HJKMNP-Z2-9]{6}$/.test(g.code) && g.can_redeem === true);
expect('A kod sabit', (await invite(U(1))).code, (g) => g === a.code);
const b = await invite(U(2));
expect('A kendi kodu', await redeem(U(1), a.code), (g) => g === 'self');
expect('B → A (küçük harf + boşluk)', await redeem(U(2), `${a.code.slice(0, 3).toLowerCase()} ${a.code.slice(3)}`), (g) => g === 'ok');
expect('B → A tekrar', await redeem(U(2), a.code), (g) => g === 'already');
expect('A → B (karşılıklı)', await redeem(U(1), b.code), (g) => g === 'not_allowed');
expect('E (10 günlük) → A', await redeem(U(5), a.code), (g) => g === 'too_late');
expect('B profiles: yalnız kendi satırı', await run('authenticated', U(2), 'select id from public.profiles'), (g) => g.length === 1 && g[0].id === U(2));
for (let i = 0; i < 10; i++) await redeem(U(3), `ZZZZZ${i}`);
expect('C 10 hatadan sonra doğru kod', await redeem(U(3), a.code), (g) => g === 'rate_limited');
expect('D null kod', await redeem(U(4), null), (g) => g === 'invalid');

// Aktif sayımı (Döngü 6 bulgu 1, 2, 5): invite_active_at, yalnız koddan sonraki günler, araya bir tam gün
// TSİ bugünü (migration ile aynı); current_date UTC olabilir, gece 21:00 sonrası kayardı
const T = "(now() at time zone 'Europe/Istanbul')::date";
const setInvitedAt = (uid, expr) => db.exec(`update public.profiles set invited_at = ${expr} where id = '${uid}'`);
const addDay = (uid, expr) => db.exec(`insert into public.user_activity_days values ('${uid}', ${expr}) on conflict do nothing`);
const touch = (uid) => run('authenticated', uid, 'select public.touch_activity()');
const activeAt = async (uid) => (await run(null, null, `select invite_active_at from public.profiles where id = '${uid}'`))[0].invite_active_at;

await touch(U(2));
expect('touch aynı gün 2. kez', await touch(U(2)), Array.isArray);
expect('touch: 1 gün → aktif değil', await activeAt(U(2)), (g) => g === null);
// Kod 5 gün önce girilmiş gibi; koddan ÖNCEKİ ve kod GÜNÜNDEKİ günler sayılmaz
await setInvitedAt(U(2), "now() - interval '5 days'");
await addDay(U(2), `${T} - 9`);
await addDay(U(2), `${T} - 5`);
await db.exec(`delete from public.user_activity_days where user_id = '${U(2)}' and day = ${T}`);
await addDay(U(2), `${T} - 1`);
await touch(U(2));
expect('DÜZELTME: koddan önceki günler sayılmaz', await activeAt(U(2)), (g) => g === null);
expect('DÜZELTME: ardışık 2 gün (23:59 + 00:01) yetmez', await activeAt(U(2)), (g) => g === null);

// KVKK: 3'ten az davetli → active null. A'ya 4 davetli daha (7, 8, 9, 10) gelir.
expect('DÜZELTME: 1 davetli → active gizli (null)', await invite(U(1)), (g) => g.total === 1 && g.active === null);
for (const i of [7, 8, 9, 10]) expect(`U${i} → A`, await redeem(U(i), a.code), (g) => g === 'ok');
expect('A sayaç: 5 gelen, 0 aktif', await invite(U(1)), (g) => g.total === 5 && g.active === 0);

// Günlük sınır: A'nın son 24 saatte 5 yeni aktif davetlisi varsa B bekler, sonra sayılır
await db.exec(`update public.profiles set invite_active_at = now() where id in ('${U(7)}','${U(8)}','${U(9)}','${U(10)}')`);
await db.exec(`update public.profiles set invited_by = '${U(1)}', invited_at = now(), invite_active_at = now() where id = '${U(11)}'`);
await addDay(U(2), `${T} - 3`); // koddan sonra: -3, -1 (+ bugün) → aralık ≥ 2
await touch(U(2));
expect('DÜZELTME: günlük sınır (5/24 saat) → B bekler', await activeAt(U(2)), (g) => g === null);
await db.exec(`update public.profiles set invite_active_at = now() - interval '2 days' where invited_by = '${U(1)}' and id <> '${U(2)}'`);
await touch(U(2));
const bActive = await activeAt(U(2));
expect('DÜZELTME: sınır boşalınca B aktif', bActive, (g) => g !== null);
await touch(U(2));
expect('invite_active_at bir kez yazılır', await activeAt(U(2)), (g) => String(g) === String(bActive));
expect('A sayaç: 6 gelen, 6 aktif', await invite(U(1)), (g) => g.total === 6 && g.active === 6);
const lb = await run(null, null, 'select * from public.admin_invite_leaderboard()');
expect('lider tablosu (postgres) + quick_redeem', lb, (g) => g[0]?.code_prefix === a.code.slice(0, 3) && g[0].total === 6 && g[0].active === 6 && g[0].quick_redeem >= 4);
expect('büyüme raporu (postgres)', await run(null, null, 'select public.admin_growth_report(current_date - 30, current_date + 1) r'), (g) => g[0].r.cohort === N);

// DÜZELTME (Döngü 6 #1): 120 gün temizliği "aktif" sayısını düşürmez
await db.exec(`update public.user_activity_days set day = day - 200 where user_id = '${U(2)}'`);
await run(null, null, (await run(null, null, "select command from cron.job where jobname = 'skor-growth-cleanup'"))[0].command);
expect('temizlik eski günleri sildi', await run(null, null, `select count(*)::int n from public.user_activity_days where user_id = '${U(2)}'`), (g) => g[0].n === 0);
expect('DÜZELTME: temizlikten sonra aktif 6 kalır', await invite(U(1)), (g) => g.active === 6);

// Eşzamanlı A→B / B→A (Döngü 6 #3): çift kilidi sıralı çağrıda da davranışı bozmaz (tek bağlantı; gerçek
// eşzamanlılık PGlite'ta üretilemez). Fonksiyon gövdesinde kilit var mı:
expect('redeem_invite çift kilidi', await run(null, null, "select prosrc from pg_proc where proname = 'redeem_invite'"), (g) => /pg_advisory_xact_lock/.test(g[0].prosrc) && /least\(v_uid, v_inviter\.id\)/.test(g[0].prosrc));

// DÜZELTME (Döngü 6 #4): davet eden hesabını silse de davetli ikinci kod giremez
await db.exec(`delete from auth.users where id = '${U(1)}'`);
const f = await invite(U(6));
expect('DÜZELTME: A silinince B, F koduna geçemez', await redeem(U(2), f.code), (g) => g === 'already');
expect('B: invited true, can_redeem false', await invite(U(2)), (g) => g.invited === true && g.can_redeem === false);
expect('B invite_active_at korunur', await activeAt(U(2)), (g) => g !== null);

// ───────────────────────────── Döngü 7: saldırgan / sınır durumları ("BULGU" = bilinen davranış, raporda)
const mk = async (from, to) => {
  for (let i = from; i <= to; i++) await db.exec(`insert into auth.users (id) values ('${U(i)}') on conflict do nothing`);
};
await mk(20, 80);
const code = async (uid) => (await invite(uid)).code;
const actives = async (inviter) => (await run(null, null, `select count(*)::int n from public.profiles where invited_by = '${inviter}' and invite_active_at is not null`))[0].n;

// 1) TSİ gün sınırı: UTC 20:59 → aynı gün 23:59; UTC 21:00 → ertesi gün 00:00
expect('TSİ: UTC 20:59:59 aynı gün', await run(null, null, "select (timestamptz '2026-11-18 20:59:59+00' at time zone 'Europe/Istanbul')::date::text d"), (g) => g[0].d === '2026-11-18');
expect('TSİ: UTC 21:00:00 ertesi gün', await run(null, null, "select (timestamptz '2026-11-18 21:00:00+00' at time zone 'Europe/Istanbul')::date::text d"), (g) => g[0].d === '2026-11-19');
const I1 = await code(U(20));
for (const x of [21, 22]) expect(`U${x} → I1`, await redeem(U(x), I1), (g) => g === 'ok');
// Kod (T-3) 20:59 UTC = TSİ T-3 23:59 → T-2 ve T (bugün) sayılır → aralık 2 → aktif
await setInvitedAt(U(21), `((${T} - 3)::timestamp + interval '20 hours 59 minutes') at time zone 'UTC'`);
// Kod (T-3) 21:00 UTC = TSİ T-2 00:00 → T-2 kod günü, sayılmaz; yalnız T → aktif değil
await setInvitedAt(U(22), `((${T} - 3)::timestamp + interval '21 hours') at time zone 'UTC'`);
for (const x of [21, 22]) {
  await addDay(U(x), `${T} - 2`);
  await touch(U(x));
}
expect('TSİ sınırı: 20:59 UTC kodu → aktif', await activeAt(U(21)), (g) => g !== null);
expect('TSİ sınırı: 21:00 UTC kodu → aktif değil', await activeAt(U(22)), (g) => g === null);

// 2) Tekrar oynatma (replay) ve sıralama
expect('replay: aynı kod tekrar → already', await redeem(U(21), I1), (g) => g === 'already');
expect('replay: başka kod → already', await redeem(U(21), await code(U(23))), (g) => g === 'already');
expect('kendi kodu küçük harf + boşluk → self', await redeem(U(20), ` ${I1.toLowerCase()} `), (g) => g === 'self');
expect('Türkçe ı / İ içeren kod → invalid', await redeem(U(24), 'ıabcde'), (g) => g === 'invalid');
expect('çok uzun girdi → invalid (hata yok)', await redeem(U(24), 'A'.repeat(5000)), (g) => g === 'invalid');
expect("tırnaklı girdi → invalid (enjeksiyon yok)", await run('authenticated', U(24), "select public.redeem_invite($$x'); drop table public.profiles; --$$) r"), (g) => g[0]?.r === 'invalid');
await db.exec(`update public.profiles set invite_fail_count = 10, invite_fail_at = now() where id = '${U(25)}'`);
expect('sınırlı hesap (10 hata) → rate_limited', await redeem(U(25), I1), (g) => g === 'rate_limited');
await db.exec(`update public.profiles set invite_fail_at = now() - interval '24 hours 1 minute' where id = '${U(25)}'`);
expect('24 saat sonra sınır kalkar → ok', await redeem(U(25), I1), (g) => g === 'ok');
expect('davetli olduktan sonra rate_limited değil already', await redeem(U(25), 'ZZZZZZ'), (g) => g === 'already');
// 7 gün sınırı: get_my_invite.can_redeem ile redeem_invite aynı kararı verir
await db.exec(`update public.profiles set created_at = now() - interval '7 days' + interval '1 minute' where id = '${U(26)}'`);
expect('7 gün - 1 dk: can_redeem true', await invite(U(26)), (g) => g.can_redeem === true);
expect('7 gün - 1 dk: redeem ok', await redeem(U(26), I1), (g) => g === 'ok');

// 3) Üçlü halka A→B→C→A (yalnız ikili karşılıklı davet engelli)
const [ca, cb, cc] = [await code(U(27)), await code(U(28)), await code(U(29))];
expect('halka: B → A', await redeem(U(28), ca), (g) => g === 'ok');
expect('halka: C → B', await redeem(U(29), cb), (g) => g === 'ok');
expect('BULGU halka: A → C kabul edilir (3-döngü)', await redeem(U(27), cc), (g) => g === 'ok');

// 4) Günlük sınır yuvarlanan 24 saat (TSİ gece yarısı sıfırlamaz) + çok sayıda eşzamanlı davetli
const I2 = await code(U(30));
for (let i = 31; i <= 60; i++) await redeem(U(i), I2);
expect('30 davetli sırayla → total 30', await invite(U(30)), (g) => g.total === 30);
await db.exec(`update public.profiles set invited_at = now() - interval '5 days' where invited_by = '${U(30)}'`);
for (let i = 31; i <= 60; i++) {
  await addDay(U(i), `${T} - 3`);
  await touch(U(i));
}
expect('30 uygun davetli → yalnız 5 aktif (5/24 saat)', await actives(U(30)), (g) => g === 5);
// 5 aktif 23:59 önce (dün TSİ olabilir) → sınır sürer; 24:01 önce → yeni 5
await db.exec(`update public.profiles set invite_active_at = now() - interval '23 hours 59 minutes' where invited_by = '${U(30)}' and invite_active_at is not null`);
for (let i = 31; i <= 60; i++) await touch(U(i));
expect('sınır 23:59 sonra hâlâ dolu (gece yarısı sıfırlamaz)', await actives(U(30)), (g) => g === 5);
await db.exec(`update public.profiles set invite_active_at = now() - interval '24 hours 1 minute' where invited_by = '${U(30)}' and invite_active_at is not null`);
for (let i = 31; i <= 60; i++) await touch(U(i));
expect('24:01 sonra 5 yeni aktif (toplam 10)', await actives(U(30)), (g) => g === 10);

// 5) invite_active_at tekdüze: gün silme, ikinci touch, tekrar kod girme değiştirmez
const before = await activeAt(U(21));
await db.exec(`delete from public.user_activity_days where user_id = '${U(21)}'`);
await touch(U(21));
await redeem(U(21), I1);
expect('invite_active_at değişmez', await activeAt(U(21)), (g) => String(g) === String(before));

// 6) Lider tablosu: sıralama active desc, total desc; aynı 3 harfli önek
await db.exec(`update public.profiles set invite_code = 'QQQ234' where id = '${U(61)}'`);
await db.exec(`update public.profiles set invite_code = 'QQQ567' where id = '${U(62)}'`);
await redeem(U(63), 'QQQ234');
await redeem(U(64), 'QQQ567');
const lb2 = await run(null, null, 'select * from public.admin_invite_leaderboard()');
expect('lider: ilk satır I2 (10 aktif / 30)', lb2, (g) => g[0].code_prefix === I2.slice(0, 3) && g[0].active === 10 && g[0].total === 30);
expect('lider: active azalan sıralı', lb2, (g) => g.every((r, i) => i === 0 || g[i - 1].active > r.active || (g[i - 1].active === r.active && g[i - 1].total >= r.total)));
expect('BULGU lider: aynı önek "QQQ" iki ayrı satır (ayırt edilemez)', lb2.filter((r) => r.code_prefix === 'QQQ').length, (g) => g === 2);

// 7) Silinen davet eden / davetli
await db.exec(`delete from auth.users where id = '${U(20)}'`);
await touch(U(22));
expect('davet eden silindi: davetli touch hata vermez, aktif olmaz', await activeAt(U(22)), (g) => g === null);
expect('davet eden silindi: lider tablosundan düşer', await run(null, null, 'select * from public.admin_invite_leaderboard()'), (g) => !g.some((r) => r.code_prefix === I1.slice(0, 3) && r.total >= 3));
const tBefore = (await invite(U(30))).total;
await db.exec(`delete from auth.users where id = '${U(31)}'`);
expect('BULGU davetli silinince total düşer (tekdüze değil)', (await invite(U(30))).total, (g) => g === tBefore - 1);
// Silinen hesabın süresi dolmamış JWT'si: touch_activity FK hatası fırlatır (istemci yutar; Döngü 7 bulgusu)
expect('BULGU silinen kullanıcıya touch → FK hatası', await touch(U(31)), (g) => typeof g === 'string' && /foreign key/.test(g));
expect('BULGU silinen kullanıcıya get_my_invite → FK hatası', await run('authenticated', U(31), 'select * from public.get_my_invite()'), (g) => typeof g === 'string' && /foreign key/.test(g));
expect('silinen kullanıcıya redeem → FK hatası (sayaç yazılmaz)', await redeem(U(31), I2), (g) => typeof g === 'string' && /foreign key/.test(g));

console.log(fails ? `\n${fails} BAŞARISIZ` : '\nTümü geçti');
process.exit(fails ? 1 : 0);
