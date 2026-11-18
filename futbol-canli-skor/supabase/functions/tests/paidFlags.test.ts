// _shared/paidFlags.ts: futbol ve NBA plan bayrakları birbirine KARIŞMAZ (Döngü 7, inovasyon §0.7 P0).
// API_FOOTBALL_PAID=1 (Pro) yapılınca NBA kota bekçisi kapanmamalı. İki katman:
//  1) saf readPaidFlags / paidFor davranışı;
//  2) kaynak taraması: plan env'lerini yalnız paidFlags.ts okur, NBA dosyaları futbol bayrağına dokunmaz.
// Modüller düzeyde Deno.env okuduğu için içe aktarılmaz (test yalnız --allow-read ile çalışır).
// Çalıştırma: npm run test:functions
import { assert, assertEquals } from 'jsr:@std/assert@1';
import { PAID_ENV, paidFor, readPaidFlags } from '../_shared/paidFlags.ts';

const env = (vars: Record<string, string>) => (name: string) => vars[name];

Deno.test('paidFlags: futbol Pro iken NBA ücretsiz kalır', () => {
  const f = readPaidFlags(env({ API_FOOTBALL_PAID: '1', API_NBA_PAID: '0' }));
  assertEquals(f, { football: true, nba: false });
  assertEquals(paidFor('nba', f), false);
  assertEquals(paidFor('football', f), true);
});

Deno.test('paidFlags: NBA bayrağı tanımsızsa kapalı (varsayılan)', () => {
  assertEquals(readPaidFlags(env({ API_FOOTBALL_PAID: '1' })), { football: true, nba: false });
  assertEquals(readPaidFlags(env({})), { football: false, nba: false });
});

Deno.test('paidFlags: yalnız tam "1" açık sayılır (eski davranışla birebir)', () => {
  for (const v of ['0', 'true', 'yes', '', ' 1', '1 ', '01']) {
    assertEquals(readPaidFlags(env({ API_FOOTBALL_PAID: v, API_NBA_PAID: v })), { football: false, nba: false }, JSON.stringify(v));
  }
  assertEquals(readPaidFlags(env({ API_NBA_PAID: '1' })), { football: false, nba: true });
});

Deno.test('paidFlags: env adları ayrı', () => {
  assertEquals(PAID_ENV.football, 'API_FOOTBALL_PAID');
  assertEquals(PAID_ENV.nba, 'API_NBA_PAID');
});

// ─────────────────────────────────────────────── kaynak taraması (bayrak karışmasına karşı kalıcı bekçi)
const ROOT = new URL('../', import.meta.url);

async function sources(dir: URL, rel = ''): Promise<{ rel: string; text: string }[]> {
  const out: { rel: string; text: string }[] = [];
  for await (const e of Deno.readDir(dir)) {
    const r = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory) {
      if (e.name === 'tests' || e.name === 'node_modules') continue;
      out.push(...(await sources(new URL(`${e.name}/`, dir), r)));
    } else if (e.name.endsWith('.ts')) {
      out.push({ rel: r, text: await Deno.readTextFile(new URL(e.name, dir)) });
    }
  }
  return out;
}

/** Yorumlar çıkarılmış kod (yorumlardaki env adları serbest) */
const code = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

Deno.test('kaynak: plan env değişkenlerini yalnız _shared/paidFlags.ts okur', async () => {
  const files = await sources(ROOT);
  assert(files.length > 10, 'kaynak bulunamadı');
  for (const { rel, text } of files) {
    if (rel === '_shared/paidFlags.ts') continue;
    const c = code(text);
    // Log metinlerinde ad geçebilir; env'den okuma (Deno.env.get / env.get) yalnız paidFlags.ts'te
    assert(!/env\.get\(\s*['"`]API_(FOOTBALL|NBA)_PAID/.test(c), `${rel}: plan bayrağını doğrudan okuyor (paidFlags.ts kullanın)`);
  }
});

Deno.test('kaynak: NBA dosyaları futbol bayrağına dokunmaz', async () => {
  const files = await sources(ROOT);
  const nba = files.filter(({ rel }) => rel.startsWith('sync-nba/') || /^_shared\/nba[A-Z]/.test(rel));
  assert(nba.some((f) => f.rel === '_shared/nbaApi.ts') && nba.some((f) => f.rel === 'sync-nba/index.ts'));
  for (const { rel, text } of nba) {
    const c = code(text);
    assert(!/FOOTBALL_PAID/.test(c), `${rel}: FOOTBALL_PAID kullanıyor`);
    assert(!/\bPAID\b[^;]*from\s+['"][^'"]*apiFootball\.ts['"]/.test(c), `${rel}: apiFootball.ts PAID içe aktarıyor`);
  }
  const nbaApi = code(files.find((f) => f.rel === '_shared/nbaApi.ts')!.text);
  assert(/const PAID = NBA_PAID;/.test(nbaApi), 'nbaApi.ts: kota bekçisi NBA_PAID ile kurulmalı');
  assert(/createQuotaGuard\(\{ paid: PAID \}\)/.test(nbaApi));
  const syncNba = code(files.find((f) => f.rel === 'sync-nba/index.ts')!.text);
  assert(/const PAID = NBA_PAID;/.test(syncNba), 'sync-nba: seri alarmı NBA_PAID ile');
});

Deno.test('kaynak: futbol tarafı FOOTBALL_PAID, "maç başladı" metni spora göre', async () => {
  const files = await sources(ROOT);
  const api = code(files.find((f) => f.rel === '_shared/apiFootball.ts')!.text);
  assert(/export const PAID = FOOTBALL_PAID;/.test(api));
  assert(!/NBA_PAID/.test(api));
  const te = code(files.find((f) => f.rel === '_shared/teamEvents.ts')!.text);
  assert(/paid: paidFor\(sport, PAID_FLAGS\)/.test(te), 'teamEvents: kickoffBody spora göre bayrak almalı');
});
