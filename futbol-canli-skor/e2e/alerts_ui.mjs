import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
const BASE = process.env.BASE_URL ?? 'http://localhost:8084';
const OUT = 'e2e/shots/'; mkdirSync(OUT, { recursive: true });
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const errs = []; p.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text().slice(0, 200)));
await p.goto(`${BASE}`, { timeout: 180000 });
await p.getByText('İskoçya').first().waitFor({ timeout: 150000 });
// Ayarlar
await p.getByLabel('Bildirim ayarları').click();
await p.getByText('🚨 Baskı Alarmı').waitFor({ timeout: 10000 });
await p.getByRole('switch', { name: '🔥 NBA Seri Alarmı' }).click();
await p.waitForTimeout(300);
console.log('ayarlar: OK, NBA anahtarı =', await p.getByRole('switch', { name: '🔥 NBA Seri Alarmı' }).isChecked());
await p.screenshot({ path: OUT + 'a1-ayarlar.png' });
await p.goBack();
// Türkiye–İskoçya: kırmızı kart alarmı + canlı baskı alarmı
await p.getByText('İskoçya').first().click();
await p.getByText('⚡ Kırmızı Kart Kırılması').waitFor({ timeout: 10000 }); console.log('kırmızı kart alarmı: OK');
await p.getByText('🚨 Baskı Alarmı').waitFor({ timeout: 30000 }); console.log('canlı baskı alarmı (Realtime): OK');
await p.screenshot({ path: OUT + 'a2-alarmlar.png' });
// Ücretsiz: kilit → paywall → abonelik → analiz
await p.getByText('🔒 Canlı taktik analiz Pro üyelere özel').click();
await p.getByText('Aboneliği Başlat (Simülasyon)').click();
await p.waitForTimeout(1500);
if (await p.getByText('Aboneliği Başlat (Simülasyon)').count()) await p.goBack();
await p.getByText('✦ Canlı taktik analizi gör').click();
await p.getByText('İskoçya 10 Kişi: Kanatlar Açıldı').waitFor({ timeout: 10000 }); console.log('Pro analiz: OK');
await p.waitForTimeout(300);
await p.screenshot({ path: OUT + 'a3-analiz.png', fullPage: true });
// NBA seri alarmı: nba_ui.mjs
console.log('hatalar:', errs.length ? errs : 'yok'); await b.close(); if (errs.length) process.exit(1);
