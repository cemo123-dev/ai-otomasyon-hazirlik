// Döngü 10 — F5 ilk açılış takım seçimi. Önizlemede yalnız ?onboarding=1 ile açılır (diğer e2e testleri
// etkilenmez). Kontroller: bir kez gösterilir, spor anahtarı, arama, en çok 5 takım, Takip et → ★ Takip filtresi,
// "Atla", 360 px + büyük yazı (x1.3) taşma yok.
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
const BASE = process.env.BASE_URL ?? 'http://localhost:8084';
const OUT = 'e2e/shots/'; mkdirSync(OUT, { recursive: true });
const b = await chromium.launch();
const errs = [];
const check = (ok, label, extra = '') => {
  if (ok) console.log(`${label}: OK${extra ? ' ' + extra : ''}`);
  else errs.push(`${label} ${extra}`);
};
const ctxPage = async (w = 390, h = 844) => {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
  p.on('console', (m) => m.type() === 'error' && errs.push(m.text().slice(0, 200)));
  return { ctx, p };
};
const boxes = (p) => p.getByRole('checkbox');

// 0) Bayraksız önizleme açılışında ekran çıkmaz (e2e zinciri ve mevcut kullanıcı akışı)
{
  const { ctx, p } = await ctxPage();
  await p.goto(BASE, { timeout: 180000 });
  await p.getByText('Boğaziçi SK').first().waitFor({ timeout: 150000 });
  await p.waitForTimeout(800);
  check(!(await p.getByText('Takımlarını seç').count()), 'önizlemede ?onboarding=1 yokken ekran yok');
  await ctx.close();
}

// 1) Seçim akışı
const { ctx, p } = await ctxPage();
await p.goto(`${BASE}/?onboarding=1`, { timeout: 180000 });
await p.getByText('Takımlarını seç').waitFor({ timeout: 150000 });
await boxes(p).first().waitFor({ timeout: 30000 });
const football = await boxes(p).count();
check(football >= 6, 'futbol takım listesi', String(football));
// Lig önceliği: ilk satırlar Süper Lig takımları
const first = await boxes(p).first().getAttribute('aria-label');
check(/Süper Lig/.test(first ?? ''), 'ilk sırada Süper Lig', first ?? '');
check((await p.getByRole('button', { name: 'Takım seç' }).getAttribute('aria-disabled')) === 'true', 'seçim yokken birincil düğme pasif');
await p.screenshot({ path: OUT + 'o1-takim-sec.png' });
// Arama
await p.getByLabel('Takım ara').fill('ege');
await p.waitForTimeout(200);
check((await boxes(p).count()) === 1, 'arama "ege" → 1 takım');
await boxes(p).first().click();
check((await boxes(p).first().getAttribute('aria-checked')) === 'true', 'seçili kutu aria-checked');
await p.getByLabel('Takım ara').fill('xyzq');
await p.getByText('bulunamadı', { exact: false }).waitFor({ timeout: 3000 }); console.log('boş arama metni: OK');
await p.getByLabel('Takım ara').fill('');
// En çok 5: 4 futbol daha + NBA'ye geçince 6. kutu pasif
let picked = 1;
for (let i = 0; picked < 4; i++) {
  const box = boxes(p).nth(i);
  if ((await box.getAttribute('aria-checked')) === 'true') continue;
  await box.click();
  picked++;
}
await p.getByRole('tab', { name: '🏀 NBA' }).click();
await boxes(p).first().waitFor({ timeout: 30000 });
check(/NBA/.test((await boxes(p).first().getAttribute('aria-label')) ?? ''), 'spor anahtarı NBA listesi');
await boxes(p).first().click();
await p.getByText('En fazla 5 takım.', { exact: false }).waitFor({ timeout: 3000 });
check((await boxes(p).nth(1).getAttribute('aria-disabled')) === 'true', '5 seçimden sonra diğerleri pasif');
await p.getByRole('button', { name: 'Takip et (5/5)' }).waitFor({ timeout: 3000 }); console.log('sayaç 5/5: OK');
await p.screenshot({ path: OUT + 'o2-bes-takim.png' });
await p.getByRole('button', { name: 'Takip et (5/5)' }).click();
await p.getByText('Boğaziçi SK').first().waitFor({ timeout: 20000 });
check(!(await p.getByText('Takımlarını seç').count()), 'Takip et → ana ekran');
await p.getByText('★ Takip', { exact: true }).click();
await p.getByText('Ege Yıldızı').first().waitFor({ timeout: 10000 }); console.log('★ Takip filtresinde seçilen takımın maçı: OK');
await p.getByLabel('Bildirim ayarları').click();
await p.getByLabel('Ege Yıldızı takibini bırak').waitFor({ timeout: 10000 });
const followedCount = await p.getByLabel(/takibini bırak$/).count();
check(followedCount === 5, 'ayarlarda 5 takım', String(followedCount));
// Bir kez: yeniden yükleme (aynı tarayıcı, ?onboarding=1) ekranı göstermez
await p.goto(`${BASE}/?onboarding=1`, { timeout: 180000 });
await p.getByText('Boğaziçi SK').first().waitFor({ timeout: 150000 });
await p.waitForTimeout(800);
check(!(await p.getByText('Takımlarını seç').count()), 'ikinci açılışta gösterilmez');
await ctx.close();

// 2) Atla: takip yok, ana ekran; 360 px + büyük yazı (x1.3) taşma yok
{
  const { ctx: c2, p: q } = await ctxPage(360, 780);
  await q.goto(`${BASE}/?onboarding=1`, { timeout: 180000 });
  await q.getByText('Takımlarını seç').waitFor({ timeout: 150000 });
  await q.getByRole('checkbox').first().waitFor({ timeout: 30000 });
  const bad = await q.evaluate((s) => {
    for (const el of document.querySelectorAll('div[dir="auto"], span')) {
      const fs = parseFloat(getComputedStyle(el).fontSize);
      if (fs) el.style.fontSize = `${fs * s}px`;
    }
    const out = [];
    for (const el of document.querySelectorAll('div[dir="auto"], span')) {
      const r = el.getBoundingClientRect();
      if (!r.width || !el.textContent?.trim()) continue;
      if (r.right > 361) out.push(el.textContent.trim().slice(0, 40));
      const st = getComputedStyle(el);
      if ((st.textOverflow === 'ellipsis' || st.webkitLineClamp !== 'none') && el.scrollWidth > el.clientWidth + 1) out.push('kırpık: ' + el.textContent.trim().slice(0, 40));
    }
    return [...new Set(out)];
  }, 1.3);
  check(!bad.length, '360 px + x1.3: taşma / kırpılma yok', JSON.stringify(bad));
  await q.screenshot({ path: OUT + 'o3-takim-sec-360-buyukyazi.png' });
  await q.getByRole('button', { name: 'Atla' }).click();
  await q.getByText('Boğaziçi SK').first().waitFor({ timeout: 20000 });
  await q.getByText('★ Takip', { exact: true }).click();
  await q.getByText('Takip ettiğin maç yok', { exact: false }).waitFor({ timeout: 5000 }); console.log('Atla → takip yok: OK');
  await c2.close();
}

console.log('hatalar:', errs.length ? errs : 'yok'); await b.close(); if (errs.length) process.exit(1);
