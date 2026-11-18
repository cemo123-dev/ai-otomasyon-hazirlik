// Döngü 9 (docs/test-raporu.md): docs/ucretli-gecis.md'yi KELİMESİ KELİMESİNE uygular — PGlite (WASM PG16).
// Üretime dokunmaz. Başlangıç = üretim durumu (0001–0018 uygulanmış, api_paid false). Sonra A3 (0019 dosyası,
// iki kez), dokümandaki ```sql blokları sırasıyla (A4, B8, B9, B10, B11, Notlar, R1, R3; Döngü 9: içerikle bulunur) ve 0017 tekrarı.
// Her blok dokümandan okunur (kopyala-yapıştır eşdeğeri); beklenen çıktılar dokümandaki metinle karşılaştırılır.
// Çalıştırma (proje kökünden):
//   npm i --no-save @electric-sql/pglite@0.2.17 && node supabase/sql-tests/0019_runbook.pglite.mjs
import { PGlite } from '@electric-sql/pglite';
import { readFileSync, readdirSync } from 'node:fs';

const DIR = new URL('../migrations/', import.meta.url);
const files = readdirSync(DIR).filter((f) => /^\d{4}_.*\.sql$/.test(f)).sort();
const chainSrc = readFileSync(new URL('./chain_0001_0017.pglite.mjs', import.meta.url), 'utf8');
const STUB = chainSrc.match(/const STUB = `([\s\S]*?)`;/)[1];
const prep = (sql) => sql.replace(/create extension if not exists (pg_cron|pg_net)[^;]*;/gi, '-- (stub) $&');
const read = (f) => prep(readFileSync(new URL(f, DIR), 'utf8'));
const doc = readFileSync(new URL('../../docs/ucretli-gecis.md', import.meta.url), 'utf8');
const blocks = [...doc.matchAll(/```sql\n([\s\S]*?)```/g)].map((m) => m[1]);
// Döngü 9: bloklar sıra numarasıyla değil, içerdikleri ayırt edici metinle bulunur (tam bir eşleşme şart)
const blk = (...needles) => {
  const hit = blocks.filter((b) => needles.every((n) => b.includes(n)));
  if (hit.length !== 1) throw new Error(`doküman bloğu ${JSON.stringify(needles)}: ${hit.length} eşleşme`);
  return hit[0];
};
const B = {
  a4cron: blk('select jobname, schedule from cron.job order by 1'),
  a4check: blk('tetikleyici_tam', 'gun_fonksiyonu'),
  b8: blk("set value = 'true'::jsonb", "key = 'api_paid'"),
  b9: blk("jobname like 'skor-sync-%'"),
  b10data: blk('gun_farki', 'public.matches'),
  b10call: blk("call_edge_function('sync-matches'"),
  b11nba: blk('nba_live', 'nba_schedule', 'nba_api_paid'),
  r1: blk("set value = 'false'::jsonb, updated_at = now() where key = 'api_paid'"),
  r3a: blk('drop function if exists public.fixture_days_ahead()'),
  r3b: blk('drop trigger if exists app_config_api_paid_schedule'),
  r3c: blk('drop function if exists public.invite_try_activate(uuid)'),
  note: blk("set value = '5'::jsonb"),
};
let fails = 0;
function expect(label, got, test) {
  const ok = test(got);
  if (!ok) fails++;
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${label.padEnd(66)} ${JSON.stringify(got).slice(0, 170)}`);
}
// SQL Editor: blok tek seferde çalışır; her ifadenin sonucu döner (Editor yalnız sonuncuyu gösterir)
const runBlock = async (sql) => {
  try {
    return (await db.exec(sql)).map((r) => r.rows);
  } catch (e) {
    return 'ERR ' + e.message;
  }
};

const db = new PGlite();
await db.exec(STUB);
await db.exec(`
create table net.calls (id serial primary key, url text, body jsonb);
create table net._http_response (id bigint primary key, status_code int, content_type text, headers jsonb,
  content text, timed_out boolean, error_msg text, created timestamptz not null default now());
create or replace function net.http_post(url text, body jsonb default '{}'::jsonb, params jsonb default '{}'::jsonb,
  headers jsonb default '{}'::jsonb, timeout_milliseconds int default 5000) returns bigint language sql as
  $$ insert into net.calls (url, body) values (url, body) returning id::bigint $$;
insert into vault.secrets values ('project_url', 'https://x.supabase.co'), ('internal_secret', 's');`);

// Üretim durumu: 0001–0018
for (const f of files.filter((f) => f < '0019')) await db.exec(read(f));
const f19 = files.find((f) => f.startsWith('0019_'));
expect('doküman: 12 sql bloğu bulundu', blocks.length, (n) => n === 12);
expect('doküman: her sql bloğu tek ifade (Editor yalnız son sonucu gösterir) — R3 hariç', Object.entries(B)
  .filter(([k]) => !k.startsWith('r3'))
  .map(([k, s]) => [k, s.split(';').filter((x) => x.trim()).length]), (g) => g.every(([, n]) => n === 1));
expect('doküman: B6 yalnız API_FOOTBALL_PAID ayarlar (FOOTBALL_QUOTA_RESERVE=500 yok)', doc.includes('FOOTBALL_QUOTA_RESERVE=500'), (v) => v === false);
expect('doküman: R2 eski FOOTBALL_QUOTA_RESERVE secret\'ını sildirir', /R2\.[\s\S]*?FOOTBALL_QUOTA_RESERVE` secret'ı tanımlıysa[\s\S]*?silin/.test(doc), (v) => v);
expect('doküman: B5 PowerShell için curl.exe, anahtar dosyada değil', doc.includes('curl.exe -s https://v3.football.api-sports.io/status') && !doc.includes('$API_FOOTBALL_KEY'), (v) => v);
expect('doküman: Kural 3 penceresi 09:00–19:30 UTC', doc.includes('09:00–19:30 UTC') && !doc.includes('07:00–19:30'), (v) => v);

// A3: 0019 dosyasının tamamı (iki kez: idempotent)
expect('A3: 0019 ilk çalıştırma hatasız', await runBlock(read(f19)), (g) => Array.isArray(g));
expect('A3: 0019 ikinci çalıştırma hatasız', await runBlock(read(f19)), (g) => Array.isArray(g));
expect('A3: api_paid false iken API çağrısı yok', (await db.query('select count(*)::int n from net.calls')).rows[0].n, (n) => n === 0);

// A4 blok 1: cron.job — dokümanın "Beklenen satırlar" listesi
const a4 = await runBlock(B.a4cron);
const a4list = a4[0].map((r) => [r.jobname, r.schedule]);
const a4rows = Object.fromEntries(a4list);
// Dokümandaki 8 satırlık tablo (Döngü 9 bulgu 7) — tablodan okunur, sıra dahil
const a4section = doc.slice(doc.indexOf('**A4.'), doc.indexOf('**A5.'));
const a4docTable = [...a4section.matchAll(/^\s*\| `([a-z-]+)` \| `([^`]+)` \|$/gm)].map((m) => [m[1], m[2]]);
expect('A4: doküman tablosu 8 satır', a4docTable.length, (n) => n === 8);
expect('A4: sorgu tam 8 satır, tabloyla birebir (sıra dahil)', a4list, (g) => JSON.stringify(g) === JSON.stringify(a4docTable));

// A4 blok 2: tek select — tetikleyici / fixture_days_ahead / app_config sütunları
const a4b = await runBlock(B.a4check);
expect('A4: tek ifade, tek satır', Array.isArray(a4b) ? [a4b.length, a4b[0].length] : a4b, (g) => g[0] === 1 && g[1] === 1);
expect('A4: tetikleyici_tam true, gün 7, api_paid/nba false, fixture_days_ahead 7', a4b[0][0], (r) =>
  r.tetikleyici_tam === true && r.gun_fonksiyonu === 7 && r.api_paid === false && r.nba_api_paid === false && r.fixture_days_ahead === 7);

// B10 veri sorgusu B8'den ÖNCE (ücretsiz plan): en büyük gün farkı ≤ 1 — örnek maçlar eklenir
const seedMatches = (from, to) => db.exec(`insert into public.matches (fixture_id, league_name, kickoff_at, sport_type, home_team, away_team)
  select 990000 + g, 'L', now() + make_interval(days => g), 'football', 'A', 'B' from generate_series(${from}, ${to}) g`);
await seedMatches(0, 1);
await db.exec(`insert into public.matches (fixture_id, league_name, kickoff_at, sport_type, home_team, away_team)
  values (991000, 'NBA', now() + interval '5 days', 'nba', 'X', 'Y')`); // NBA satırı sayılmamalı
const b10before = await runBlock(B.b10data);
expect('B10 (B8 öncesi): sorgu hatasız, en büyük gun_farki ≤ 1', Array.isArray(b10before) ? Math.max(...b10before[0].map((r) => r.gun_farki)) : b10before, (n) => n <= 1);

// B8
expect('B8: update hatasız', await runBlock(B.b8), (g) => Array.isArray(g));
const calls = (await db.query('select url, body from net.calls order by id')).rows;
expect('B8: fikstür çağrısı tam bir kez kuyruğa alındı', calls, (g) =>
  g.length === 1 && g[0].url.endsWith('/functions/v1/sync-matches') && g[0].body.mode === 'schedule' && g[0].body.cadence === 'paid');

// B9
const b9 = (await runBlock(B.b9))[0];
const by = Object.fromEntries(b9.map((r) => [r.jobname, r]));
// Dokümandaki 5 satırlık B9 tablosu
const b9section = doc.slice(doc.indexOf('**B9.'), doc.indexOf('**B10.'));
const b9docTable = [...b9section.matchAll(/^\s*\| `([a-z-]+)` \| `([^`]+)` \|/gm)].map((m) => [m[1], m[2]]);
expect('B9: doküman tablosu 5 satır', b9docTable.length, (n) => n === 5);
expect('B9: sorgu tam 5 satır, tabloyla birebir (sıra dahil)', b9.map((r) => [r.jobname, r.schedule]), (g) => JSON.stringify(g) === JSON.stringify(b9docTable));
expect('B9: skor-sync-live * 9-23, cadence paid', by['skor-sync-live'], (r) => r.schedule === '* 9-23 * * *' && r.command.includes('"cadence":"paid"'));
expect('B9: skor-sync-schedule 0 3,15, cadence paid', by['skor-sync-schedule'], (r) => r.schedule === '0 3,15 * * *' && r.command.includes('"cadence":"paid"'));
expect('B9: skor-sync-cleanup değişmedi, cadence yok', by['skor-sync-cleanup'], (r) => r.schedule === a4rows['skor-sync-cleanup'] && r.command.includes('{"mode":"live"}') && !r.command.includes('cadence'));
expect('B9: nba-* A4 ile aynı', [by['nba-sync-live'].schedule, by['nba-sync-schedule'].schedule], (g) => g[0] === a4rows['nba-sync-live'] && g[1] === a4rows['nba-sync-schedule']);
const afterB8 = Object.fromEntries((await runBlock(B.a4cron))[0].map((r) => [r.jobname, r.schedule]));
expect('B9: yalnız skor-sync-live/schedule değişti; diğer 6 satır A4 ile aynı', Object.keys(a4rows).filter((k) => afterB8[k] !== a4rows[k]).sort(), (g) =>
  JSON.stringify(g) === '["skor-sync-live","skor-sync-schedule"]');

// B10 veri sorgusu: Edge fikstürü −1…+7 doldurduktan sonra (benzetim) gün farkı 2…7 görünür, NBA sayılmaz
await seedMatches(2, 7);
const b10after = await runBlock(B.b10data);
expect('B10: gun_farki 0…7 futbol satırları (NBA hariç)', Array.isArray(b10after) ? b10after[0].map((r) => [r.gun_farki, Number(r.mac)]) : b10after, (g) =>
  JSON.stringify(g) === JSON.stringify([0, 1, 2, 3, 4, 5, 6, 7].map((d) => [d, 1])));
expect('B10: elle call_edge_function hatasız, tek sayı döner', await runBlock(B.b10call), (g) => Array.isArray(g) && g[0].length === 1);
expect('B10: doküman log biçimi kodla aynı ("skipped":[])', doc.includes('[sync-matches] schedule ok {"scheduled":<N>,"enriched":<E>,"skipped":[],"quota":<Q>}'), (v) => v);

// B11: NBA değişmedi sorgusu (tek satır)
const b11 = await runBlock(B.b11nba);
expect('B11: nba_live / nba_schedule / nba_api_paid', Array.isArray(b11) ? b11[0] : b11, (g) =>
  g.length === 1 && g[0].nba_live === '*/30 23,0-6 * * *' && g[0].nba_schedule === '0 20 * * *' && g[0].nba_api_paid === false);

// Notlar: gün sayısı 5
expect('Not: fixture_days_ahead = 5', (await runBlock(B.note), (await db.query('select public.fixture_days_ahead() n')).rows[0].n), (n) => n === 5);
await db.exec(`update public.app_config set value = '7'::jsonb where key = 'fixture_days_ahead'`);

// Not: api_paid satırı silinirse ücretsiz takvim (0019 DELETE)
await db.exec(`create temp table k as select * from public.app_config where key = 'api_paid'`);
await db.exec(`delete from public.app_config where key = 'api_paid'`);
expect('Not: api_paid silinince ücretsiz takvim', (await db.query(`select schedule from cron.job where jobname = 'skor-sync-live'`)).rows[0].schedule, (s) => s === '*/30 12-22 * * *');
await db.exec(`insert into public.app_config select * from k; drop table k;`); // INSERT true → ücretli + 1 çağrı
expect('… geri eklenince (true) ücretli', (await db.query(`select schedule from cron.job where jobname = 'skor-sync-live'`)).rows[0].schedule, (s) => s === '* 9-23 * * *');

// Not: 0018 tekrar → 0019 tekrar (sıra notu)
expect('Not: 0018 tekrar (ücretliyken) hatasız', await runBlock(read(files.find((f) => f.startsWith('0018_')))), (g) => Array.isArray(g));
expect('… 0019 tekrar hatasız', await runBlock(read(f19)), (g) => Array.isArray(g));
expect('… ücretli takvim korunur', (await db.query(`select schedule from cron.job where jobname = 'skor-sync-live'`)).rows[0].schedule, (s) => s === '* 9-23 * * *');

// R1
await db.exec('delete from net.calls');
expect('R1: update hatasız', await runBlock(B.r1), (g) => Array.isArray(g));
const r1 = Object.fromEntries((await runBlock(B.b9))[0].map((r) => [r.jobname, r]));
expect('R1: */30 12-22 ve 0 9, gövdede cadence yok', [r1['skor-sync-live'], r1['skor-sync-schedule']], ([l, s]) =>
  l.schedule === '*/30 12-22 * * *' && s.schedule === '0 9 * * *' && !l.command.includes('cadence') && !s.command.includes('cadence'));
expect('R1: ücretsize dönüşte çağrı yok', (await db.query('select count(*)::int n from net.calls')).rows[0].n, (n) => n === 0);

// R3: 0019 iki satır → 0018 GERİ DÖNÜŞ bloğu → 0017 tekrar → invite_try_activate drop
expect('R3: 0019 geri dönüş satırları hatasız', await runBlock(B.r3a), (g) => Array.isArray(g));
expect('R3: 0018 geri dönüş bloğu hatasız', await runBlock(B.r3b), (g) => Array.isArray(g));
expect('R3: 0017 tekrar hatasız', await runBlock(read(files.find((f) => f.startsWith('0017_')))), (g) => Array.isArray(g));
expect('R3: invite_try_activate drop hatasız', await runBlock(B.r3c), (g) => Array.isArray(g));
const fin = Object.fromEntries((await db.query(`select jobname, schedule from cron.job`)).rows.map((r) => [r.jobname, r.schedule]));
expect('R3 sonrası: 0004 takvimi, skor-invite-recount yok', fin, (g) =>
  g['skor-sync-live'] === '*/30 12-22 * * *' && g['skor-sync-schedule'] === '0 9 * * *' && !('skor-invite-recount' in g));
const fns = (await db.query(`select proname from pg_proc where pronamespace = 'public'::regnamespace and proname in
  ('fixture_days_ahead','api_paid_for','on_api_paid_change','apply_football_sync_schedule','invite_try_activate','invite_recount_held','api_paid')`)).rows.map((r) => r.proname).sort();
expect('R3 sonrası: yalnız api_paid() kalır (istemci yedeği)', fns, (g) => JSON.stringify(g) === '["api_paid"]');
expect('R3 sonrası: tetikleyici yok', (await db.query(`select count(*)::int n from pg_trigger where tgname = 'app_config_api_paid_schedule'`)).rows[0].n, (n) => n === 0);
expect('R3 sonrası: api_paid() authenticated için false', await db.exec('set role authenticated; select public.api_paid() p; reset role;').then((r) => r[1].rows[0].p, (e) => 'ERR ' + e.message), (p) => p === false);

console.log(fails ? `\n${fails} FAIL` : '\nhepsi OK');
process.exit(fails ? 1 : 0);
