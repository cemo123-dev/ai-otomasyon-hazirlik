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
await p.getByText('KIRILMA SENARYOSU', { exact: true }).waitFor({ timeout: 30000 }); console.log('maç önü raporu: OK');
const bad = await p.getByText(/veri yetersiz|Belirlenemedi|veri yok/i).count();
if (bad) errs.push(`"veri yetersiz" türü metin görünüyor (${bad})`); else console.log('mazeret metni yok: OK');
await p.screenshot({ path: OUT + 'p1-macönü.png', fullPage: true });

// Tasarım B-7: ücretsiz API planı + test kullanıcısı değil (?paid=0&tester=0, mockSource).
// Takip bandı akıllı alarm vaat etmez; ana ekran hapı fiyat/satın alma demez.
const q = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
q.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
await q.goto(`${BASE}/?paid=0&tester=0`, { timeout: 180000 });
await q.getByText('✦ Pro · yakında', { exact: true }).waitFor({ timeout: 60000 }); console.log('ücretsiz: Pro hapı "yakında": OK');
if (await q.getByText("Pro'ya geç").count()) errs.push('test kullanıcısı olmayanda "Pro\'ya geç" görünüyor');
await q.screenshot({ path: OUT + 'f1-ucretsiz-liste.png' });
await q.goto(`${BASE}/match/9005?paid=0&tester=0`, { timeout: 180000 });
await q.getByText('🔔 Maçı takip et · maç başlayınca bildirim al', { exact: true }).waitFor({ timeout: 60000 });
if (await q.getByText(/akıllı alarm/).count()) errs.push('ücretsiz planda takip bandı akıllı alarm vaat ediyor');
else console.log('ücretsiz: takip bandı "maç başlayınca bildirim": OK');
await q.screenshot({ path: OUT + 'f2-ucretsiz-takip.png' });
await q.getByText('🔔 Maçı takip et · maç başlayınca bildirim al', { exact: true }).click();
await q.getByText('🔔 Takip ediliyor · maç başlayınca bildirim gelir', { exact: true }).waitFor({ timeout: 10000 }); console.log('ücretsiz: takipte metni: OK');
console.log('hatalar:', errs.length ? errs : 'yok'); await b.close(); if (errs.length) process.exit(1);
