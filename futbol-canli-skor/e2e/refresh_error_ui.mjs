// Döngü 3 (bulgu 1): liste yüklendikten sonra arka plan yenilemesi (uygulama öne gelince) başarısız olursa
// yüklü liste korunmalı; tam ekran hata kutusuna dönmemeli.
// ?mockFail=list + __skorMockOk: önce başarılı yükleme, sonra "ağ koptu" ve öne gelme (visibilitychange).
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
const BASE = process.env.BASE_URL ?? 'http://localhost:8084';
const OUT = 'e2e/shots/'; mkdirSync(OUT, { recursive: true });
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const errs = []; p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
await p.addInitScript(() => { globalThis.__skorMockOk = true; });
await p.goto(`${BASE}/?mockFail=list`, { timeout: 180000 });
await p.getByText('İskoçya').first().waitFor({ timeout: 150000 });
console.log('ilk yükleme: OK');
// Ağ koptu; kullanıcı uygulamayı arka plana alıp geri getirir
await p.evaluate(() => {
  globalThis.__skorMockOk = false;
  const set = (v) => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => v }); Object.defineProperty(document, 'hidden', { configurable: true, get: () => v === 'hidden' }); document.dispatchEvent(new Event('visibilitychange')); };
  set('hidden'); set('visible');
});
await p.waitForTimeout(3000);
const errorShown = await p.getByText('Maçlar yüklenemedi', { exact: false }).count();
const listShown = await p.getByText('İskoçya').count();
const noticeShown = await p.getByText('Liste yenilenemedi', { exact: false }).count();
await p.screenshot({ path: OUT + 'r1-arka-plan-hatasi.png' });
console.log(`öne gelince yenileme hatası: hata kutusu=${errorShown > 0}, liste görünür=${listShown > 0}, uyarı=${noticeShown > 0}`);
// Ağ geri gelince çekip yenileme uyarıyı kaldırır
await p.evaluate(() => {
  globalThis.__skorMockOk = true;
  const set = (v) => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => v }); Object.defineProperty(document, 'hidden', { configurable: true, get: () => v === 'hidden' }); document.dispatchEvent(new Event('visibilitychange')); };
  set('hidden'); set('visible');
});
await p.getByText('Liste yenilenemedi', { exact: false }).waitFor({ state: 'detached', timeout: 10000 }); console.log('toparlanınca uyarı kalktı: OK');
console.log('hatalar:', errs.length ? errs : 'yok'); await b.close();
if (errorShown || !listShown) { console.log('HATA: yüklü liste hata ekranıyla değişti'); process.exit(2); }
if (!noticeShown) { console.log('HATA: yenileme uyarısı görünmedi'); process.exit(1); }
if (errs.length) process.exit(1);
