// Döngü 5: 360 px + büyük yazı (iOS "xxLarge" ≈ %124, Android %130) benzetimi.
// RN-web'de fontScale yok: görünür metinlerin font-size'ı SCALE ile çarpılır, sonra
// tek satırlık (numberOfLines=1) metinlerde kırpılma (scrollWidth > clientWidth) aranır.
// Native maxFontSizeMultiplier'ın web karşılığı yok: `data-maxfontscale` taşıyan metin (ui.tsx maxFontScale)
// ve içindekiler en fazla o kadar büyütülür. Kırpılan metin varsa betik hata verir (npm run e2e zincirinde).
import { chromium } from 'playwright-core';
const BASE = process.env.BASE_URL ?? 'http://localhost:8084';
const SCALE = Number(process.env.FONT_SCALE ?? 1.3);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 360, height: 780 }, deviceScaleFactor: 2 });

const scaleAndFindClipped = () =>
  p.evaluate((s) => {
    for (const el of document.querySelectorAll('div[dir="auto"], span')) {
      if (el.dataset.scaled) continue;
      const fs = parseFloat(getComputedStyle(el).fontSize);
      const cap = Number(el.closest('[data-maxfontscale]')?.dataset.maxfontscale ?? Infinity);
      if (fs) { el.style.fontSize = `${fs * Math.min(s, cap)}px`; el.dataset.scaled = '1'; }
    }
    const out = [];
    for (const el of document.querySelectorAll('div[dir="auto"]')) {
      const st = getComputedStyle(el);
      if (st.textOverflow !== 'ellipsis' && st.webkitLineClamp === 'none') continue;
      if (el.scrollWidth > el.clientWidth + 1) out.push(el.textContent.trim().slice(0, 40));
    }
    return [...new Set(out)];
  }, SCALE);

await p.goto(BASE, { timeout: 180000 });
await p.getByText('Boğaziçi SK').first().waitFor({ timeout: 150000 });
const listClipped = await scaleAndFindClipped();
console.log(`liste kırpılan (x${SCALE}):`, JSON.stringify(listClipped));
await p.getByText('Boğaziçi SK').first().click();
await p.getByRole('tab', { name: 'Özet' }).waitFor({ timeout: 10000 });
await p.waitForTimeout(500);
const matchClipped = await scaleAndFindClipped();
console.log(`maç kırpılan (x${SCALE}):`, JSON.stringify(matchClipped));
await p.screenshot({ path: 'e2e/shots/lf1-mac-buyukyazi.png' });
// Pro sekmesi ekran okuyucuda "Pro" bilgisini verir (Döngü 5, bulgu 3)
const proTab = await p.getByRole('tab', { name: 'AI Taktik, Pro' }).count();
console.log('Pro sekme etiketi:', proTab ? 'OK' : 'YOK');
await b.close();
const clipped = [...listClipped, ...matchClipped];
if (clipped.length || !proTab) {
  console.error('HATA: büyük yazıda kırpılan metin:', JSON.stringify(clipped));
  process.exit(1);
}
