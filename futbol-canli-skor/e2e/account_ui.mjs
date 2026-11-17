import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
const BASE = process.env.BASE_URL ?? 'http://localhost:8084';
const OUT = 'e2e/shots/'; mkdirSync(OUT, { recursive: true });
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const errs = []; p.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text().slice(0, 200)));
await p.goto(BASE, { timeout: 180000 });
await p.getByText('İskoçya').first().waitFor({ timeout: 150000 });
// Test hesabı (önizleme): Pro yap
await p.getByText('Pro’ya geç').click();
await p.getByText('Aboneliği Başlat (Simülasyon)').click();
await p.getByText('✦ PRO').waitFor({ timeout: 10000 }); console.log('test aboneliği: OK');
// Ayarlar: yasal metinler
await p.getByLabel('Bildirim ayarları').click();
await p.getByText('Gizlilik Politikası').click();
await p.getByText('Topladığımız veriler').waitFor({ timeout: 5000 }); console.log('gizlilik politikası: OK');
await p.screenshot({ path: OUT + 'k1-gizlilik.png' });
await p.goBack();
await p.getByText('KVKK Aydınlatma Metni').click();
await p.getByText('Haklarınız (KVKK m.11)').waitFor({ timeout: 5000 }); console.log('KVKK metni: OK');
await p.goBack();
// Hesap silme: onay → Pro sıfırlanır
p.once('dialog', (d) => d.accept());
await p.getByText('Hesabımı sil').click();
await p.getByText('Hesabın silindi', { exact: false }).waitFor({ timeout: 10000 }); console.log('hesap silme: OK');
await p.screenshot({ path: OUT + 'k2-hesap.png', fullPage: true });
await p.goBack();
await p.getByText('Pro’ya geç').waitFor({ timeout: 10000 }); console.log('silme sonrası Pro kapalı: OK');
console.log('hatalar:', errs.length ? errs : 'yok'); await b.close(); if (errs.length) process.exit(1);
