// Döngü 3 (bulgu 4): ayarlar okunamazsa varsayılanlarla kayıt yok, "Tekrar dene" toparlar.
// Tasarım B-3: hata varken bildirim kartı hiç çizilmez (bilinmeyen durum "açık" görünmesin).
// ?mockFail=prefs → getNotificationPrefs, test globalThis.__skorMockOk = true diyene kadar ağ hatası verir.
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
const BASE = process.env.BASE_URL ?? 'http://localhost:8084';
const OUT = 'e2e/shots/'; mkdirSync(OUT, { recursive: true });
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const errs = []; p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
await p.goto(`${BASE}/settings?mockFail=prefs`, { timeout: 180000 });
await p.getByText('Ayarlar yüklenemedi', { exact: false }).waitFor({ timeout: 150000 });
if (await p.getByText('Failed to fetch').count()) throw new Error('ham İngilizce hata metni görünüyor');
if (await p.getByRole('switch').count()) throw new Error('yükleme hatasında anahtar görünüyor (bilinmeyen durum açık sanılır)');
console.log('yükleme hatası: anahtar yok, yalnız hata kutusu: OK');
await p.screenshot({ path: OUT + 's1-ayar-hatasi.png' });
await p.evaluate(() => { globalThis.__skorMockOk = true; });
await p.getByRole('button', { name: 'Ayarları yeniden yükle' }).click();
await p.getByText('Ayarlar yüklenemedi', { exact: false }).waitFor({ state: 'detached', timeout: 10000 });
if (await p.getByRole('switch').first().isDisabled()) throw new Error('toparlandıktan sonra anahtar hâlâ kilitli');
console.log('Tekrar dene sonrası anahtarlar açık: OK');
console.log('hatalar:', errs.length ? errs : 'yok'); await b.close(); if (errs.length) process.exit(1);
