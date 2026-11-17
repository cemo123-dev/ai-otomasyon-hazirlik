import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
const BASE = process.env.BASE_URL ?? 'http://localhost:8084';
const OUT = 'e2e/shots/'; mkdirSync(OUT, { recursive: true });
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto(`${BASE}/match/9000009102`, { timeout: 180000 });
await p.getByText('🔥 NBA Seri Alarmı').waitFor({ timeout: 60000 }); console.log('NBA seri alarmı: OK');
await p.screenshot({ path: OUT + 'a4-nba.png' });
// Box score: bitmiş senaryo maçı
await p.goto(`${BASE}/match/9000009101`, { timeout: 180000 });
await p.getByText('Box Score').click();
await p.getByText('M. Reyes').waitFor({ timeout: 10000 });
await p.getByText('TOPLAM').first().waitFor({ timeout: 5000 }); console.log('box score (ev): OK');
// iki takım alt alta: deplasman tablosu da aynı ekranda
await p.getByText('L. Moreau').waitFor({ timeout: 5000 }); console.log('box score (deplasman): OK');
await p.screenshot({ path: OUT + 'a5-boxscore.png' });
console.log('hatalar:', errs.length ? errs : 'yok'); await b.close(); if (errs.length) process.exit(1);
