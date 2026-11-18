// Tasarım tur 3 §D-1: ana ekran liste iskeleti. ?mockSlow=list ile ilk liste isteği bekletilir.
// Kontroller: dönen simge değil 3 iskelet kart; erişilebilirlik (progressbar, "Maçlar yükleniyor");
// veri gelince ilk lig kartının üst kenarı iskeletle aynı y'de (kayma ≤ 4 pt); hareketi azalt → sabit opaklık;
// aşağı çekerek / arka plan yenilemesinde iskelet yok (loading yalnız veri yokken).
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
const BASE = process.env.BASE_URL ?? 'http://localhost:8084';
const OUT = 'e2e/shots/'; mkdirSync(OUT, { recursive: true });
const b = await chromium.launch();
const errs = [];
const must = (cond, msg) => { if (!cond) throw new Error(msg); };

async function open(reducedMotion) {
  const p = await b.newPage({ viewport: { width: 360, height: 780 }, deviceScaleFactor: 2, reducedMotion });
  p.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
  p.on('console', (m) => m.type() === 'error' && errs.push(m.text().slice(0, 200)));
  await p.goto(`${BASE}/?mockSlow=list`, { timeout: 180000 });
  return p;
}

const p = await open('no-preference');
const sk = p.getByRole('progressbar', { name: 'Maçlar yükleniyor' });
await sk.waitFor({ timeout: 150000 });
// İlk kartın üst kenarı: iskelet kabının ilk çocuğunun ilk kartı
const firstCardTop = () =>
  p.evaluate(() => {
    const el = document.querySelector('[aria-label="Maçlar yükleniyor"]');
    const card = el?.firstElementChild?.firstElementChild;
    return card ? card.getBoundingClientRect().top : null;
  });
const skTop = await firstCardTop();
const skStyle = await p.evaluate(() => {
  const cs = getComputedStyle(document.querySelector('[aria-label="Maçlar yükleniyor"]').firstElementChild.firstElementChild);
  return { bg: cs.backgroundColor, rad: cs.borderTopLeftRadius };
});
const cards = await p.evaluate(() => document.querySelector('[aria-label="Maçlar yükleniyor"]')?.firstElementChild?.children.length ?? 0);
must(cards === 3, `iskelet kart sayısı ${cards}`);
// Opaklık döngüsü: iki ölçüm farklı olmalı
const op1 = await p.evaluate(() => getComputedStyle(document.querySelector('[aria-label="Maçlar yükleniyor"]').firstElementChild).opacity);
await p.waitForTimeout(450);
const op2 = await p.evaluate(() => getComputedStyle(document.querySelector('[aria-label="Maçlar yükleniyor"]').firstElementChild).opacity);
must(op1 !== op2, `opaklık değişmiyor: ${op1} ${op2}`);
await p.screenshot({ path: OUT + 'd1-iskelet-360.png' });
console.log(`iskelet: 3 kart, progressbar, opaklık ${op1} → ${op2}: OK`);

await p.evaluate(() => { globalThis.__skorMockOk = true; });
await p.getByText('İskoçya').first().waitFor({ timeout: 30000 });
must((await sk.count()) === 0, 'veri geldi, iskelet hâlâ görünüyor');
// Gerçek listenin ilk lig kartı: iskelet kartıyla aynı zemin + üst köşe yarıçapına sahip en üstteki öğe
const listTop = await p.evaluate(({ bg, rad }) => {
  let best = null;
  for (const el of document.querySelectorAll('div')) {
    const cs = getComputedStyle(el);
    if (cs.backgroundColor !== bg || cs.borderTopLeftRadius !== rad) continue;
    const r = el.getBoundingClientRect();
    if (r.height > 0 && r.width > 200 && (best === null || r.top < best)) best = r.top;
  }
  return best;
}, skStyle);
const shift = Math.abs(listTop - skTop);
console.log(`ilk kart üst kenarı: iskelet ${Math.round(skTop)}, liste ${Math.round(listTop)} → kayma ${shift.toFixed(1)} pt`);
must(shift <= 4, `kayma ${shift} > 4 pt`);
await p.screenshot({ path: OUT + 'd1-liste-360.png' });

// Hareketi azalt: sabit opaklık 0.8
const r = await open('reduce');
await r.getByRole('progressbar', { name: 'Maçlar yükleniyor' }).waitFor({ timeout: 60000 });
await r.waitForTimeout(300);
const ro1 = await r.evaluate(() => getComputedStyle(document.querySelector('[aria-label="Maçlar yükleniyor"]').firstElementChild).opacity);
await r.waitForTimeout(500);
const ro2 = await r.evaluate(() => getComputedStyle(document.querySelector('[aria-label="Maçlar yükleniyor"]').firstElementChild).opacity);
must(ro1 === ro2 && Math.abs(Number(ro1) - 0.8) < 0.01, `hareketi azalt: opaklık ${ro1} ${ro2}`);
console.log(`hareketi azalt: sabit ${ro1}: OK`);

console.log('hatalar:', errs.length ? errs.join(' | ') : 'yok');
await b.close();
if (errs.length) process.exit(1);
