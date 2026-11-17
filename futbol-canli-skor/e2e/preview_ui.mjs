import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
const BASE = process.env.BASE_URL ?? 'http://localhost:8084';
const OUT = 'e2e/shots/'; mkdirSync(OUT, { recursive: true });
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const errs = []; p.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text().slice(0, 200)));
// Maç önü AI: Pro → rapor; "veri yetersiz / belirlenemedi" metni görünmemeli
await p.goto(`${BASE}/match/9005`, { timeout: 180000 });
await p.getByText('AI Taktik').click();
await p.getByRole('button', { name: /Pro/ }).first().click();
await p.getByText('Aboneliği Başlat (Simülasyon)').click();
await p.waitForTimeout(1500);
if (await p.getByText('Aboneliği Başlat (Simülasyon)').count()) await p.goBack();
await p.getByText('Kırılma Senaryosu').waitFor({ timeout: 30000 }); console.log('maç önü raporu: OK');
const bad = await p.getByText(/veri yetersiz|Belirlenemedi|veri yok/i).count();
if (bad) errs.push(`"veri yetersiz" türü metin görünüyor (${bad})`); else console.log('mazeret metni yok: OK');
await p.screenshot({ path: OUT + 'p1-macönü.png', fullPage: true });
console.log('hatalar:', errs.length ? errs : 'yok'); await b.close(); if (errs.length) process.exit(1);
