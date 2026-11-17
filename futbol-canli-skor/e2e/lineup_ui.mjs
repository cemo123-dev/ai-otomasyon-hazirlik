import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
const BASE = process.env.BASE_URL ?? 'http://localhost:8084';
const OUT = 'e2e/shots/'; mkdirSync(OUT, { recursive: true });
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const errs = []; p.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text().slice(0, 200)));
await p.goto(BASE, { timeout: 180000 });
await p.getByText('Boğaziçi SK').first().waitFor({ timeout: 150000 });
// Tarih şeridi: varsayılan Bugün; Dün/Yarın kendi maçlarını gösterir, filtrelerle birlikte çalışır
const tab = (t) => p.getByRole('tab', { name: new RegExp('^' + t + ',') });
// Varsayılan Bugün: bugünün maçı görünür, dünün/yarının maçı görünmez
if (await p.getByText('Karadeniz Spor').count()) throw new Error('varsayılan gün Bugün değil (dünün maçı görünüyor)');
if (await p.getByText('Marmara Gençlik').count()) throw new Error('varsayılan gün Bugün değil (yarının maçı görünüyor)');
await tab('Dün').click();
await p.getByText('Karadeniz Spor').waitFor({ timeout: 5000 });
if (await p.getByText('Boğaziçi SK').count()) throw new Error('Dün seçiliyken bugünün maçı görünüyor');
await p.getByText('Canlı').first().click();
await p.getByText('Dün için bu filtrede maç yok.').waitFor({ timeout: 5000 }); console.log('Dün + Canlı filtresi: OK');
await p.getByText('Tümü').click();
await tab('Yarın').click();
await p.getByText('Marmara Gençlik').waitFor({ timeout: 5000 });
if (await p.getByText('Karadeniz Spor').count()) throw new Error('Yarın seçiliyken dünün maçı görünüyor');
console.log('tarih şeridi: OK');
await p.screenshot({ path: OUT + 'l1-yarin.png' });
// Veri tazeliği: canlı filtrede açıklama + canlı satırda "Son güncelleme"
await tab('Bugün').click();
await p.getByText('Canlı').first().click();
await p.getByText('~30 dk aralıkla güncellenir', { exact: false }).waitFor({ timeout: 5000 });
await p.getByText('Son güncelleme', { exact: false }).first().waitFor({ timeout: 5000 }); console.log('veri tazeliği etiketi: OK');
await p.screenshot({ path: OUT + 'l2-canli.png' });
await p.getByText('Tümü').click();
// Kadro sekmesi: biten maç → diziliş, yedekler, teknik direktör, puanlar + maçın oyuncusu
await p.getByText('Boğaziçi SK').first().click();
// Liste ekranı yığında gizli kalır: yalnız görünür etiket aranır (maç başlığı)
await p.getByText('Son güncelleme', { exact: false }).locator('visible=true').first().waitFor({ timeout: 10000 });
await p.getByRole('tab', { name: 'Kadro' }).click();
await p.getByLabel('Saha dizilişi').waitFor({ timeout: 5000 });
await p.getByText('★ MAÇIN OYUNCUSU').waitFor({ timeout: 5000 });
await p.getByText('Teknik direktör', { exact: false }).first().waitFor({ timeout: 5000 });
await p.getByText('Okan Ural').first().waitFor({ timeout: 5000 });
console.log('kadro + puanlar: OK');
await p.screenshot({ path: OUT + 'l3-kadro.png', fullPage: true });
// Kadrosu olmayan maç: boş durum, çökme yok
await p.goto(`${BASE}/match/9007`, { timeout: 60000 });
await p.getByRole('tab', { name: 'Kadro' }).click();
await p.getByText('Kadrolar henüz açıklanmadı').waitFor({ timeout: 5000 }); console.log('kadro boş durumu: OK');
// NBA: Kadro sekmesi yok
await p.goto(`${BASE}/match/9000009101`, { timeout: 60000 });
await p.getByRole('tab', { name: 'Özet' }).waitFor({ timeout: 30000 });
if (await p.getByRole('tab', { name: 'Kadro' }).count()) throw new Error('NBA maçında Kadro sekmesi var');
console.log('NBA kadro sekmesi yok: OK');
console.log('hatalar:', errs.length ? errs : 'yok'); await b.close(); if (errs.length) process.exit(1);
