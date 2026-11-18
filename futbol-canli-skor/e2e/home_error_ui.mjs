// Ana ekran yükleme hatası: Türkçe metin + "Tekrar dene" ile toparlanma (Döngü 2, bulgu 3).
// Önizleme verisi ?mockFail=list ile, test izin verene kadar liste isteklerinde ağ hatası verir (bkz. mockSource.ts).
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
const BASE = process.env.BASE_URL ?? 'http://localhost:8084';
const OUT = 'e2e/shots/'; mkdirSync(OUT, { recursive: true });
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const errs = []; p.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text().slice(0, 200)));
await p.goto(`${BASE}/?mockFail=list`, { timeout: 180000 });
await p.getByText('Bağlantı kurulamadı', { exact: false }).waitFor({ timeout: 150000 });
if (await p.getByText('Failed to fetch').count()) throw new Error('ham İngilizce hata metni görünüyor');
console.log('Türkçe hata metni: OK');
await p.screenshot({ path: OUT + 'e1-hata.png' });
// Ağ "geri geldi": sonraki liste isteği başarılı
await p.evaluate(() => { globalThis.__skorMockOk = true; });
await p.getByRole('button', { name: 'Maçları yeniden yükle' }).click();
await p.getByText('İskoçya').first().waitFor({ timeout: 30000 }); console.log('Tekrar dene sonrası liste: OK');
if (await p.getByText('Bağlantı kurulamadı', { exact: false }).count()) throw new Error('hata metni kalktı ama görünüyor');
// Filtre çipleri ve Pro butonu erişilebilir rol/etiket taşır (bulgu 15)
await p.getByRole('tab', { name: 'Biten' }).waitFor({ timeout: 5000 });
await p.getByRole('button', { name: "Pro'ya geç" }).waitFor({ timeout: 5000 });
console.log('erişilebilirlik rolleri: OK');
await p.screenshot({ path: OUT + 'e2-toparlandi.png' });
console.log('hatalar:', errs.length ? errs : 'yok'); await b.close(); if (errs.length) process.exit(1);
