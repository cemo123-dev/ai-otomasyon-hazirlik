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
await p.getByText("Pro'ya geç").click();
await p.getByText('Aboneliği Başlat (Simülasyon)').click();
await p.getByText('✦ PRO').waitFor({ timeout: 10000 }); console.log('test aboneliği: OK');
// Ayarlar: yasal metinler
await p.getByLabel('Bildirim ayarları').click();
await p.getByText('Gizlilik Politikası').click();
await p.getByText('Topladığımız veriler').waitFor({ timeout: 5000 }); console.log('gizlilik politikası: OK');
// F3/F4 (0017): kullanım günleri + davet bilgisi + saklama süresi
await p.getByText('Kullanım günleri: Uygulamayı hangi günlerde', { exact: false }).waitFor({ timeout: 5000 });
await p.getByText('Kullanım günleri 120 gün sonra otomatik silinir', { exact: false }).first().waitFor({ timeout: 5000 });
console.log('gizlilik: kullanım günleri / davet bilgisi: OK');
await p.screenshot({ path: OUT + 'k1-gizlilik.png' });
await p.goBack();
await p.getByText('KVKK Aydınlatma Metni').click();
await p.getByText('Haklarınız (KVKK m.11)').waitFor({ timeout: 5000 }); console.log('KVKK metni: OK');
// Döngü 6 bulgu 5: davet eden yalnız "aktif davetli" sayısını görür (3+ davetliden sonra)
await p.getByText('davetiyle en az 3 kişi gelmeden gösterilmez', { exact: false }).first().waitFor({ timeout: 5000 });
console.log('KVKK: aktif davetli sayacı açıklaması: OK');
await p.goBack();
// Hesap silme: onay → Pro sıfırlanır
let dialogText = '';
p.once('dialog', (d) => { dialogText = d.message(); d.accept(); });
await p.getByText('Hesabımı sil').click();
await p.getByText('Hesabın silindi', { exact: false }).waitFor({ timeout: 10000 }); console.log('hesap silme: OK');
// Döngü 6 bulgu 10: onay metni davet bilgisini ve kullanım günlerini de sayar
if (!/davet kodun/.test(dialogText) || !/kullanım günlerin/.test(dialogText)) errs.push('silme onayı davet / kullanım günlerinden söz etmiyor: ' + dialogText.slice(0, 120));
else console.log('silme onayı: davet + kullanım günleri: OK');
await p.screenshot({ path: OUT + 'k2-hesap.png', fullPage: true });
// F3: silme sonrası davet kartı yeni hesabın (mock: sıfırlanan) kodunu ve sayacını gösterir
await p.getByText('ABC 234', { exact: true }).waitFor({ timeout: 10000 });
await p.getByText('Davetinle gelen: 4 · Aktif olan: 2').waitFor({ timeout: 10000 });
console.log('silme sonrası davet kartı sıfırlandı: OK');
await p.goBack();
await p.getByText("Pro'ya geç").waitFor({ timeout: 10000 }); console.log('silme sonrası Pro kapalı: OK');
console.log('hatalar:', errs.length ? errs : 'yok'); await b.close(); if (errs.length) process.exit(1);
