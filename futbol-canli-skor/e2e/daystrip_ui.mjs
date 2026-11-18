// Döngü 8: 0018 gün şeridi — 360 px + büyük yazı (x1.3).
//  - Ücretli futbol (önizleme varsayılanı): 9 gün, yatay kaydırma; sayfa yatay taşmaz; son gün seçilince görünür.
//  - NBA ücretsiz kalır: 3 gün. Futbolda +5 seçiliyken NBA'e geçince "Bugün" seçili.
//  - "Canlı" filtresinde tazelik notu spora göre (futbol ücretli: dakika rakamı yok; NBA: ~30 dk).
//  - ?paid=0 → futbol da 3 gün ve ~30 dk metni.
//  - Döngü 8 bulgu 8: ?days=3 (sunucu fixture_days_ahead = 3) → futbol 5 gün (−1…+3), boş gün yok.
import { chromium } from 'playwright-core';
const BASE = process.env.BASE_URL ?? 'http://localhost:8084';
const SCALE = Number(process.env.FONT_SCALE ?? 1.3);
const b = await chromium.launch();
const errs = [];
const check = (label, ok, info = '') => {
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${label} ${info}`);
  if (!ok) errs.push(label);
};

async function open(q = '') {
  const p = await b.newPage({ viewport: { width: 360, height: 780 }, deviceScaleFactor: 2 });
  await p.goto(`${BASE}/${q}`, { timeout: 180000 });
  await p.getByRole('tab', { name: /^Bugün, / }).first().waitFor({ timeout: 150000 });
  await p.waitForTimeout(800);
  return p;
}
const scale = (p) =>
  p.evaluate((s) => {
    for (const el of document.querySelectorAll('div[dir="auto"], span')) {
      if (el.dataset.scaled) continue;
      const fs = parseFloat(getComputedStyle(el).fontSize);
      const cap = Number(el.closest('[data-maxfontscale]')?.dataset.maxfontscale ?? Infinity);
      if (fs) { el.style.fontSize = `${fs * Math.min(s, cap)}px`; el.dataset.scaled = '1'; }
    }
  }, SCALE);
const dayTabs = (p) => p.getByRole('tab', { name: /^(Dün|Bugün|Yarın|Paz|Pzt|Sal|Çar|Per|Cum|Cmt), \d+ / });
// RN-web accessibilityState.selected'ı aria-selected olarak yazmıyor: seçili gün, başlığın "canlı" rengiyle anlaşılır
const titleColor = (loc) => loc.evaluate((e) => getComputedStyle(e.querySelector('div[dir="auto"]')).color);
const pageOverflow = (p) => p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
// Gün düğmelerinde metin kırpılması / sarma (başlık ya da tarih 2 satıra inmiş mi)
const dayClip = (p) =>
  p.evaluate(() => {
    const out = [];
    for (const t of document.querySelectorAll('[role="tab"]')) {
      if (!/^(Dün|Bugün|Yarın|Paz|Pzt|Sal|Çar|Per|Cum|Cmt), /.test(t.getAttribute('aria-label') ?? '')) continue;
      for (const el of t.querySelectorAll('div[dir="auto"]')) {
        const lh = parseFloat(getComputedStyle(el).lineHeight) || parseFloat(getComputedStyle(el).fontSize) * 1.3;
        if (el.scrollWidth > el.clientWidth + 1 || el.getBoundingClientRect().height > lh * 1.6) out.push(el.textContent);
      }
    }
    return out;
  });

// 1) Ücretli futbol: 9 gün
const p = await open();
const ACTIVE = await titleColor(p.getByRole('tab', { name: /^Bugün, / }));
const isSel = async (loc) => (await titleColor(loc)) === ACTIVE;
check('seçili renk ayırt edici (Dün ≠ Bugün)', !(await isSel(p.getByRole('tab', { name: /^Dün, / }))), ACTIVE);
await scale(p);
await p.waitForTimeout(300);
check('futbol (ücretli) 9 gün', (await dayTabs(p).count()) === 9, String(await dayTabs(p).count()));
check('sayfa yatay taşmıyor', (await pageOverflow(p)) <= 0, String(await pageOverflow(p)));
check('gün düğmelerinde kırpılma/sarma yok (x1.3)', (await dayClip(p)).length === 0, JSON.stringify(await dayClip(p)));
const last = dayTabs(p).nth(8);
await last.click();
await p.waitForTimeout(700);
const box = await last.boundingBox();
check('+7 seçilince görünür alanda', !!box && box.x >= 0 && box.x + box.width <= 361, JSON.stringify(box));
check('+7 seçili', await isSel(last));
await p.screenshot({ path: 'e2e/shots/c8-daystrip-9gun.png' });
// +5 seçiliyken NBA'e geç
await dayTabs(p).nth(6).click();
await p.getByRole('tab', { name: '🏀 NBA' }).click();
await p.waitForTimeout(800);
check('NBA 3 gün', (await dayTabs(p).count()) === 3, String(await dayTabs(p).count()));
check('NBA\'e geçince Bugün seçili', await isSel(p.getByRole('tab', { name: /^Bugün, / })));
await p.getByRole('tab', { name: 'Canlı' }).click();
await p.waitForTimeout(500);
check('NBA tazelik notu ~30 dk', (await p.getByText(/~30 dk aralıkla/).count()) > 0);
await p.getByRole('tab', { name: '⚽ Futbol' }).click();
await p.waitForTimeout(800);
check('futbol (ücretli) tazelik notu dakika rakamsız', (await p.getByText(/Futbolda maç sırasında skorlar sık güncellenir/).count()) > 0 && (await p.getByText(/~30 dk/).count()) === 0);
check('futbola dönünce 9 gün', (await dayTabs(p).count()) === 9);
await p.close();

// 2) Ücretsiz plan (?paid=0): futbol 3 gün + ~30 dk
const q = await open('?paid=0');
check('?paid=0 futbol 3 gün', (await dayTabs(q).count()) === 3, String(await dayTabs(q).count()));
await q.getByRole('tab', { name: 'Canlı' }).click();
await q.waitForTimeout(500);
check('?paid=0 futbol tazelik notu ~30 dk', (await q.getByText(/~30 dk aralıkla/).count()) > 0);
await q.close();

// 3) Sunucu fikstür gün sayısı 3 (0019 app_config.fixture_days_ahead): şerit −1…+3
const r = await open('?days=3');
check('?days=3 futbol 5 gün', (await dayTabs(r).count()) === 5, String(await dayTabs(r).count()));
check('?days=3 sayfa yatay taşmaz', (await pageOverflow(r)) <= 0, String(await pageOverflow(r)));
await r.close();

await b.close();
if (errs.length) {
  console.error('HATA:', errs.join(' | '));
  process.exit(1);
}
console.log('daystrip_ui: tümü geçti');
