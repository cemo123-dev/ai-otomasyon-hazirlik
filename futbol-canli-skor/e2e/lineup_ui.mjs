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
await p.getByText('Dün için canlı maç yok').waitFor({ timeout: 5000 }); console.log('Dün + Canlı filtresi: OK');
await p.getByText('Tümü').click();
await tab('Yarın').click();
await p.getByText('Marmara Gençlik').waitFor({ timeout: 5000 });
if (await p.getByText('Karadeniz Spor').count()) throw new Error('Yarın seçiliyken dünün maçı görünüyor');
console.log('tarih şeridi: OK');
await p.screenshot({ path: OUT + 'l1-yarin.png' });
// Veri tazeliği: canlı filtrede açıklama + canlı satırda "Son güncelleme"
await tab('Bugün').click();
await p.getByText('Canlı').first().click();
// Önizleme varsayılanı ücretli futbol planı (0018): tazelik notu F1 aşaması (dakika rakamı yok)
await p.getByText('Futbolda maç sırasında skorlar sık güncellenir', { exact: false }).waitFor({ timeout: 5000 });
if (await p.getByText('~30 dk', { exact: false }).count()) throw new Error('ücretli futbolda ~30 dk notu görünüyor');
await p.getByText('Son güncelleme', { exact: false }).first().waitFor({ timeout: 5000 }); console.log('veri tazeliği etiketi: OK');
await p.screenshot({ path: OUT + 'l2-canli.png' });
await p.getByText('Tümü').click();
// 0018 gün şeridi: ücretli futbol (?paid=1) −1…+7 = 9 gün, kaydırılır; +7 seçilebilir. NBA ücretsiz: 3 gün.
const dayTabs = (pg) => pg.getByRole('tab', { name: /^[^,]+, \d{1,2} (Oca|Şub|Mar|Nis|May|Haz|Tem|Ağu|Eyl|Eki|Kas|Ara)$/ });
{
  const q = await b.newPage({ viewport: { width: 390, height: 844 } });
  q.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
  await q.goto(`${BASE}/?paid=1`, { timeout: 180000 });
  await q.getByText('Boğaziçi SK').first().waitFor({ timeout: 150000 });
  const n = await dayTabs(q).count();
  if (n !== 9) throw new Error(`?paid=1: 9 gün bekleniyordu, ${n}`);
  const last = dayTabs(q).nth(8);
  const lastName = await last.getAttribute('aria-label');
  if (/^(Dün|Bugün|Yarın),/.test(lastName ?? '')) throw new Error('+7 etiketi gün adı değil: ' + lastName);
  await last.click();
  await q.waitForTimeout(400);
  if (!(await last.isVisible())) throw new Error('+7 seçilince görünür alana kaydırılmadı');
  await q.getByText(`${lastName.split(',')[0]} için bu filtrede maç yok.`).waitFor({ timeout: 5000 });
  await q.screenshot({ path: OUT + 'l4-paid-7gun.png' });
  // NBA ücretsiz kalır: 3 gün; futbolda +7 seçiliyken NBA'e geçince Bugün'e döner
  await q.getByRole('tab', { name: '🏀 NBA' }).click();
  await q.waitForTimeout(300);
  const nn = await dayTabs(q).count();
  if (nn !== 3) throw new Error(`NBA: 3 gün bekleniyordu, ${nn}`);
  // react-native-web aria-selected yazmıyor: seçim boş durum metninden doğrulanır
  if (await q.getByText(`${lastName.split(',')[0]} için`, { exact: false }).count()) throw new Error('NBA: şeritte olmayan gün seçili kaldı');
  await q.getByText('Canlı').first().click();
  await q.getByText('~30 dk aralıkla güncellenir', { exact: false }).waitFor({ timeout: 5000 });
  console.log('?paid=1: 9 günlük şerit, +7 seçilebilir, NBA 3 gün + ~30 dk notu: OK');
  // ?paid=0: 3 gün ve eski not
  await q.goto(`${BASE}/?paid=0`, { timeout: 180000 });
  await q.getByText('Boğaziçi SK').first().waitFor({ timeout: 150000 });
  const nf = await dayTabs(q).count();
  if (nf !== 3) throw new Error(`?paid=0: 3 gün bekleniyordu, ${nf}`);
  await q.getByText('Canlı').first().click();
  await q.getByText('~30 dk aralıkla güncellenir', { exact: false }).waitFor({ timeout: 5000 });
  if (await q.getByText('sık güncellenir', { exact: false }).count()) throw new Error('ücretsizde yeni tazelik notu görünüyor');
  console.log('?paid=0: 3 günlük şerit + ~30 dk notu: OK');
  await q.close();
}
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
