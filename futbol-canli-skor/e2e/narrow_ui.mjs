// 360 px genişlikte yerleşim kontrolü: yatay taşma ve kırpılan öğe var mı?
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
const BASE = process.env.BASE_URL ?? 'http://localhost:8084';
const OUT = 'e2e/shots/'; mkdirSync(OUT, { recursive: true });
const W = 360;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: W, height: 780 }, deviceScaleFactor: 2 });
const errs = []; p.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text().slice(0, 200)));

// Görünür metin öğelerinden sağ kenarı ekran dışına taşanlar
const overflow = () => p.evaluate((w) => {
  const out = [];
  for (const el of document.querySelectorAll('div[dir="auto"], span')) {
    const r = el.getBoundingClientRect();
    if (!r.width || !el.textContent?.trim() || el.children.length > 1) continue;
    const style = getComputedStyle(el);
    if (style.visibility === 'hidden' || style.display === 'none') continue;
    if (r.right > w + 1) out.push(`${el.textContent.trim().slice(0, 40)} → ${Math.round(r.right)}`);
  }
  return [...new Set(out)].slice(0, 15);
}, W);

await p.goto(BASE, { timeout: 180000 });
await p.getByText('Boğaziçi SK').first().waitFor({ timeout: 150000 });
console.log('liste taşma:', JSON.stringify(await overflow()));
await p.screenshot({ path: OUT + 'n1-liste-360.png' });

await p.getByText('Boğaziçi SK').first().click();
await p.getByRole('tab', { name: 'Özet' }).waitFor({ timeout: 10000 });
console.log('maç taşma:', JSON.stringify(await overflow()));
await p.screenshot({ path: OUT + 'n2-mac-360.png' });
for (const t of ['İstatistik', 'Kadro']) {
  const tab = p.getByRole('tab', { name: t });
  if (await tab.count()) {
    await tab.click();
    await p.waitForTimeout(800);
    console.log(`${t} taşma:`, JSON.stringify(await overflow()));
  }
}
await p.screenshot({ path: OUT + 'n3-kadro-360.png', fullPage: true });

await p.goto(`${BASE}/paywall`, { timeout: 60000 });
await p.waitForTimeout(2500);
console.log('paywall taşma:', JSON.stringify(await overflow()));
await p.screenshot({ path: OUT + 'n4-paywall-360.png', fullPage: true });

await p.goto(`${BASE}/settings`, { timeout: 60000 });
await p.waitForTimeout(2500);
console.log('ayarlar taşma:', JSON.stringify(await overflow()));
await p.screenshot({ path: OUT + 'n5-ayarlar-360.png', fullPage: true });

await p.goto(`${BASE}/match/9000009101`, { timeout: 60000 });
await p.getByRole('tab', { name: 'Özet' }).waitFor({ timeout: 30000 });
console.log('NBA taşma:', JSON.stringify(await overflow()));
await p.screenshot({ path: OUT + 'n6-nba-360.png' });
// Derin bağlantıyla açılan maç ekranında geri yığını yok: "‹ Maçlar" ana ekrana döner (tasarım #14)
await p.getByRole('button', { name: 'Maçlar listesine dön' }).click();
await p.getByText('Boğaziçi SK').first().waitFor({ timeout: 30000 });
console.log('derin bağlantıdan geri: OK');

console.log('hatalar:', errs.length ? errs.join(' | ') : 'yok');
await b.close();
