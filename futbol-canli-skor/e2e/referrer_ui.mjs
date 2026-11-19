// Döngü 11 (§0.8): Play Install Referrer → davet kodu önerisi (önizlemede `?referrer=` taklidi) ve Play mağaza
// bağlantısı (`?dl=play`). Kod yalnız kullanıcı "Kaydet"e basınca gönderilir; otomatik kayıt yok.
// Önizlemede satın alma (RevenueCat) kapalı: paywall bugünkü gibi.
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
const BASE = process.env.BASE_URL ?? 'http://localhost:8084';
const OUT = 'e2e/shots/'; mkdirSync(OUT, { recursive: true });
const b = await chromium.launch();
const errs = [];
const page = async (w = 390) => {
  const p = await b.newPage({ viewport: { width: w, height: 844 }, deviceScaleFactor: 2 });
  p.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
  p.on('console', (m) => m.type() === 'error' && errs.push(m.text().slice(0, 200)));
  await p.addInitScript(() => {
    window.__shared = [];
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: (d) => {
        window.__shared.push(d);
        return Promise.resolve();
      },
    });
  });
  return p;
};
const must = (cond, msg) => { if (!cond) throw new Error(msg); };
const lastShared = (p) => p.evaluate(() => { const d = window.__shared.at(-1); return d?.text ?? d?.message ?? ''; });
const REF = (code) => encodeURIComponent(`utm_source=app&utm_medium=invite&utm_campaign=invite&utm_content=${code}`);
const banner = (p) => p.getByText('Davet kodun hazır.', { exact: false });
const suggestion = (p) => p.getByText(/Seni davet eden kodu bulduk:/);
const waitHome = (p) => p.getByRole('button', { name: 'Bildirim ayarları' }).waitFor({ timeout: 150000 });

// 1) Geçerli referrer → ana ekran bandı → Ayarlar önerisi → Kaydet → teşekkür, öneri ve bant kalkar
const p = await page();
await p.goto(`${BASE}/?referrer=${REF('XYZ789')}`, { timeout: 180000 });
await waitHome(p);
await banner(p).waitFor({ timeout: 15000 });
await p.screenshot({ path: OUT + 'r1-referrer-bant.png' });
// Bant yalnız yönlendirir: sunucuya bir şey gitmez (mock davet durumu değişmedi → Ayarlar'da öneri görünür)
await p.getByRole('link', { name: "Davet kodun hazır. Ayarlar'da onayla." }).click();
await suggestion(p).waitFor({ timeout: 30000 });
const sText = await suggestion(p).innerText();
must(/XYZ789/.test(sText), 'öneri metninde kod yok: ' + sText);
must((await p.getByText('Davet kodun var mı?').count()) === 0, 'öneri varken elle giriş satırı da görünüyor');
await suggestion(p).scrollIntoViewIfNeeded();
await p.screenshot({ path: OUT + 'r2-referrer-oneri.png' });
await p.getByRole('button', { name: 'Davet kodu X Y Z 7 8 9 kaydet' }).click();
await p.getByText('Teşekkürler, davet kaydedildi.').waitFor({ timeout: 10000 });
must((await suggestion(p).count()) === 0, 'kayıttan sonra öneri kalmadı mı');
await p.goBack();
await waitHome(p);
await p.waitForTimeout(500);
must((await banner(p).count()) === 0, 'kayıttan sonra ana ekran bandı hâlâ görünüyor');
console.log('geçerli referrer → bant → onay → kayıt: OK');

// 2) "Bu kod değil" → öneri silinir, elle giriş satırı açılır; hiçbir kod kaydedilmez
const q = await page();
await q.goto(`${BASE}/settings?referrer=${REF('XYZ789')}`, { timeout: 120000 });
await suggestion(q).waitFor({ timeout: 60000 });
await q.getByRole('button', { name: 'Bu kod değil' }).click();
await q.getByText('Davet kodun var mı?').waitFor({ timeout: 5000 });
must((await suggestion(q).count()) === 0, '"Bu kod değil" sonrası öneri duruyor');
must((await q.getByText('Teşekkürler, davet kaydedildi.').count()) === 0, '"Bu kod değil" kod kaydetti');
console.log('"Bu kod değil": OK');

// 3) Bant kapatılır (×): öneri Ayarlar'da kalır
await q.goto(`${BASE}/?referrer=${REF('XYZ789')}`, { timeout: 120000 });
await waitHome(q);
await banner(q).waitFor({ timeout: 15000 });
await q.getByRole('button', { name: 'Davet bandını kapat' }).click();
must((await banner(q).count()) === 0, 'bant kapanmadı');
await q.getByRole('button', { name: 'Bildirim ayarları' }).click();
await suggestion(q).waitFor({ timeout: 30000 });
console.log('bant kapatma, öneri Ayarlarda kalır: OK');

// 4) Geçersiz / organik / kendi kodu → bant ve öneri yok
for (const [label, ref, onlySettings] of [
  ['geçersiz kod (ABC123)', REF('ABC123')],
  ['organik', encodeURIComponent('utm_source=google-play&utm_medium=organic')],
  ['kendi kodu (ABC234)', REF('ABC234'), 'yalnız Ayarlar'],
]) {
  const r = await page();
  await r.goto(`${BASE}/settings?referrer=${ref}`, { timeout: 120000 });
  await r.getByText('Davet kodun var mı?').waitFor({ timeout: 60000 });
  must((await suggestion(r).count()) === 0, `${label}: öneri görünüyor`);
  // Kendi kodu: ana ekran kodu bilmez (get_my_invite çağrılmaz); taze kurulumda kendi kodu referrer'da olamaz
  if (onlySettings) {
    await r.close();
    console.log(`${label}: öneri yok: OK`);
    continue;
  }
  await r.goto(`${BASE}/?referrer=${ref}`, { timeout: 120000 });
  await waitHome(r);
  await r.waitForTimeout(500);
  must((await banner(r).count()) === 0, `${label}: bant görünüyor`);
  await r.close();
  console.log(`${label}: bant/öneri yok: OK`);
}

// 5) Play mağaza bağlantısı (?dl=play): maç paylaşımı ve davetiye pazarlama §9.1 biçiminde
const s = await page();
await s.goto(`${BASE}/match/9001?dl=play`, { timeout: 120000 });
await s.getByRole('tab', { name: 'Özet' }).waitFor({ timeout: 60000 });
await s.getByRole('button', { name: 'Maçı paylaş' }).click();
await s.waitForFunction(() => window.__shared.length > 0, null, { timeout: 5000 });
let t = await lastShared(s);
must(
  t.includes('https://play.google.com/store/apps/details?id=com.skorplus.app&referrer=utm_source%3Dapp%26utm_medium%3Dshare%26utm_campaign%3Dmatch_share%26utm_content%3DABC234'),
  'maç paylaşımı Play bağlantısı yanlış:\n' + t,
);
must(!t.includes('/m/'), 'Play bağlantısında /m/ var');
await s.goto(`${BASE}/settings?dl=play`, { timeout: 120000 });
await s.getByRole('button', { name: 'Davetiye gönder' }).waitFor({ timeout: 60000 });
await s.getByRole('button', { name: 'Davetiye gönder' }).click();
await s.waitForTimeout(300);
t = await lastShared(s);
must(/Google Play'den indir: https:\/\/play\.google\.com\/store\/apps\/details\?id=com\.skorplus\.app&referrer=utm_source%3Dapp%26utm_medium%3Dinvite%26utm_campaign%3Dinvite%26utm_content%3DABC234/.test(t),
  'davetiye Play bağlantısı yanlış:\n' + t);
console.log('Play bağlantıları (paylaşım + davetiye): OK');

// 6) Önizlemede satın alma kapalı: paywall'da mağaza öğeleri yok, Ayarlar'da "Abonelikleri yönet" yok
await s.goto(`${BASE}/paywall`, { timeout: 120000 });
await s.getByText('✦ SKOR+ PRO').waitFor({ timeout: 60000 });
must((await s.getByText('Satın alımları geri yükle').count()) === 0, 'önizlemede geri yükle düğmesi görünüyor');
await s.goto(`${BASE}/settings`, { timeout: 120000 });
await s.getByText('Gizlilik Politikası').waitFor({ timeout: 60000 });
must((await s.getByText('Abonelikleri yönet').count()) === 0, 'önizlemede "Abonelikleri yönet" görünüyor');
console.log('önizlemede satın alma kapalı: OK');

console.log('hatalar:', errs.length ? errs.join(' | ') : 'yok');
await b.close();
if (errs.length) process.exit(1);
