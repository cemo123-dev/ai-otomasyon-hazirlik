import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
const BASE = process.env.BASE_URL ?? 'http://localhost:8084';
const OUT = 'e2e/shots/'; mkdirSync(OUT, { recursive: true });
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const errs = []; p.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text().slice(0, 200)));
await p.goto(BASE, { timeout: 180000 });
await p.getByText('İskoçya').first().waitFor({ timeout: 150000 });
// "Takip" filtresi başta boş
await p.getByText('★ Takip', { exact: true }).click();
await p.getByText('Takip ettiğin maç yok', { exact: false }).waitFor({ timeout: 5000 }); console.log('boş takip filtresi: OK');
await p.getByText('Tümü').click();
await p.screenshot({ path: OUT + 't1-liste.png' });
// Maç ekranında takım takibi
await p.getByText('İskoçya').first().click();
await p.getByLabel('Türkiye takımını takip et').click();
await p.getByLabel('Türkiye takibini bırak').waitFor({ timeout: 5000 }); console.log('takım takibi: OK');
await p.screenshot({ path: OUT + 't2-mac.png' });
await p.goBack();
// Takip filtresinde takımın maçı görünür
await p.getByText('★ Takip', { exact: true }).click();
await p.getByText('İskoçya').first().waitFor({ timeout: 5000 }); console.log('takip filtresinde takımın maçı: OK');
// Ayarlarda takım listesi + maç başladı anahtarı
await p.getByLabel('Bildirim ayarları').click();
await p.getByText('⚽ Maç Başladı').waitFor({ timeout: 5000 });
await p.getByLabel('Türkiye takibini bırak').waitFor({ timeout: 5000 }); console.log('ayarlarda takım listesi: OK');
await p.screenshot({ path: OUT + 't3-ayarlar.png', fullPage: true });
await p.getByLabel('Türkiye takibini bırak').click();
await p.getByText('Henüz takım takip etmiyorsun', { exact: false }).waitFor({ timeout: 5000 }); console.log('takibi bırakma: OK');
console.log('hatalar:', errs.length ? errs : 'yok'); await b.close(); if (errs.length) process.exit(1);
