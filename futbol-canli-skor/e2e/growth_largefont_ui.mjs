// Döngü 6: F3 davet kartı ve "Paylaş" başlık düğmesi — 360 px + büyük yazı (x1.3) benzetimi.
// largefont_ui.mjs ile aynı yöntem (görünür metnin font-size'ı SCALE ile çarpılır). Kontroller:
// yatay taşma yok, davet kodu satırı kırpılmıyor, "Kaydet" ve "Davetiye gönder" metni kutusuna sığıyor,
// başlıkta "‹ Maçlar" ile "Paylaş" çakışmıyor.
import { chromium } from 'playwright-core';
const BASE = process.env.BASE_URL ?? 'http://localhost:8084';
const SCALE = Number(process.env.FONT_SCALE ?? 1.3);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 360, height: 780 }, deviceScaleFactor: 2 });
const errs = [];
p.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));

const scale = () =>
  p.evaluate((s) => {
    for (const el of document.querySelectorAll('div[dir="auto"], span, input')) {
      if (el.dataset.scaled) continue;
      const fs = parseFloat(getComputedStyle(el).fontSize);
      const cap = Number(el.closest('[data-maxfontscale]')?.dataset.maxfontscale ?? Infinity);
      if (fs) { el.style.fontSize = `${fs * Math.min(s, cap)}px`; el.dataset.scaled = '1'; }
    }
  }, SCALE);
// Metin kutusundan taşan (yatay) öğe
const overflowing = (texts) =>
  p.evaluate((ts) => {
    const out = [];
    for (const el of document.querySelectorAll('div[dir="auto"]')) {
      const t = el.textContent.trim();
      if (!ts.some((x) => t === x)) continue;
      if (el.scrollWidth > el.clientWidth + 1) out.push(t);
      const parent = el.parentElement.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      if (r.right > parent.right + 1 || r.left < parent.left - 1) out.push(`${t} (kutu dışı)`);
    }
    return out;
  }, texts);

await p.goto(`${BASE}/settings`, { timeout: 180000 });
await p.getByText('Arkadaşını davet et').waitFor({ timeout: 150000 });
await p.getByText('ABC 234', { exact: true }).waitFor({ timeout: 10000 });
await scale();
await p.waitForTimeout(300);
const sw = await p.evaluate(() => document.documentElement.scrollWidth);
const bad = await overflowing(['ABC 234', 'Kaydet', 'Davetiye gönder', 'Davet kodun var mı?']);
await p.getByText('Davet kodun var mı?').scrollIntoViewIfNeeded();
await p.screenshot({ path: 'e2e/shots/c6-davet-buyukyazi-360.png' });
console.log(`ayarlar 360 x${SCALE}: scrollWidth=${sw}, taşan=${JSON.stringify(bad)}`);

await p.goto(`${BASE}/match/9000009101`, { timeout: 60000 });
const share = p.getByRole('button', { name: 'Maçı paylaş' });
await share.waitFor({ timeout: 30000 });
await scale();
await p.waitForTimeout(300);
const sb = await share.boundingBox();
const back = await p.getByRole('button', { name: 'Maçlar listesine dön' }).boundingBox();
const headerOk = sb.x + sb.width <= 360 && back.x + back.width <= sb.x;
await p.screenshot({ path: 'e2e/shots/c6-paylas-buyukyazi-360.png' });
console.log(`başlık x${SCALE}: Paylaş [${Math.round(sb.x)}-${Math.round(sb.x + sb.width)}], geri bitiş ${Math.round(back.x + back.width)} → ${headerOk ? 'OK' : 'ÇAKIŞMA'}`);

await b.close();
console.log('hatalar:', errs.length ? errs.join(' | ') : 'yok');
if (sw > 360 || bad.length || !headerOk || errs.length) process.exit(1);
