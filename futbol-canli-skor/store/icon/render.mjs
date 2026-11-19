// Skor+ simge adayları: SVG kaynaklarını üretir ve Playwright (Chromium) ile PNG'ye çevirir.
// Çalıştırma (proje kökünden):
//   PLAYWRIGHT_BROWSERS_PATH=<pw-browsers> node store/icon/render.mjs
// Çıktı yalnız store/icon/ altına yazılır. assets/ klasörüne dokunmaz.
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { deflateSync, inflateSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = dirname(fileURLToPath(import.meta.url));

// Tasarım token'ları (src/theme.ts ile aynı)
const T = {
  bg: '#0A0E14',
  surface: '#121821',
  surfaceAlt: '#18202B',
  border: '#232D3A',
  text: '#E8EDF3',
  textMuted: '#8A97A8',
  live: '#2BE37A',
  pro: '#F5C451',
};

// ---- İşaret geometrisi -------------------------------------------------------
// "S": iki yay üzerinden kalın çizgi (merkez çizgisi). Kendi koordinat sistemi:
// üst halka merkezi (100,95), alt halka merkezi (100,205), r = 55, çizgi kalınlığı 44.
// Dış sınır: x 23..177, y 18..282.
const S_PATH = 'M147.6 67.5 A55 55 0 1 0 100 150 A55 55 0 1 1 52.4 232.5';
const S_STROKE = 44;
// "+": iki yuvarlak köşeli dikdörtgen; merkez (232, 46), kol 80, kalınlık 26 (48 px boyutta da seçilsin diye).
const plus = (fill) => {
  const cx = 232, cy = 46, len = 80, th = 26, r = th / 2;
  return `<rect x="${cx - len / 2}" y="${cy - th / 2}" width="${len}" height="${th}" rx="${r}" fill="${fill}"/>` +
    `<rect x="${cx - th / 2}" y="${cy - len / 2}" width="${th}" height="${len}" rx="${r}" fill="${fill}"/>`;
};
// Grup sınır kutusu: x 23..272, y 6..282 → merkez (147.5, 144), yükseklik 276
const G = { cx: 147.5, cy: 144, h: 276 };

/** İşaret grubunu canvas merkezine, verilen yükseklikte yerleştirir */
function mark({ size, height, sColor, plusColor, strokeScale = 1 }) {
  const s = height / G.h;
  const tx = size / 2 - G.cx * s;
  const ty = size / 2 - G.cy * s;
  return `<g transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${s.toFixed(4)})">` +
    `<path d="${S_PATH}" fill="none" stroke="${sColor}" stroke-width="${S_STROKE * strokeScale}" stroke-linecap="round"/>` +
    plus(plusColor) +
    `</g>`;
}

// ---- Adaylar -----------------------------------------------------------------
// A: Gece   — koyu zemin, beyaz S, yeşil +   (uygulama başlığındaki "Skor+" ile aynı renkler)
// B: Saha   — yeşil zemin, koyu S ve koyu +  (mağazada en parlak seçenek)
// C: Canlı  — koyu zemin, yeşil S, beyaz +   (yeşil ana renk; "+" ikincil)
const CANDIDATES = {
  A: { name: 'Gece', bg: T.bg, s: T.text, plus: T.live, splashS: T.text, splashPlus: T.live },
  B: { name: 'Saha', bg: T.live, s: T.bg, plus: T.bg, splashS: T.live, splashPlus: T.text },
  C: { name: 'Canlı', bg: T.bg, s: T.live, plus: T.text, splashS: T.live, splashPlus: T.text },
};

// Adaptif simge: 108 dp tuval = 1024 px. Güvenli alan 66 dp → çap 626 px (r 313).
// İşaret yüksekliği 440 px → grup köşegen yarıçapı ≈ 296 px (< 313). Maskeler 72 dp (r 341) gösterir.
const ADAPTIVE_H = 440;
// Play simgesi / icon.png: tam dolu kare; Play %30 köşe yarıçapı uygular. İşaret yüksekliği tuvalin %50'si.
const FULL_RATIO = 0.5;

const svg = (size, body, bg) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
  (bg ? `<rect width="${size}" height="${size}" fill="${bg}"/>` : '') + body + `</svg>`;

function sources(c) {
  return {
    'icon.svg': svg(1024, mark({ size: 1024, height: 1024 * FULL_RATIO, sColor: c.s, plusColor: c.plus }), c.bg),
    'adaptive-foreground.svg': svg(1024, mark({ size: 1024, height: ADAPTIVE_H, sColor: c.s, plusColor: c.plus })),
    'adaptive-background.svg': svg(1024, '', c.bg),
    'adaptive-monochrome.svg': svg(1024, mark({ size: 1024, height: ADAPTIVE_H, sColor: '#FFFFFF', plusColor: '#FFFFFF' })),
    // Splash zemini app.json'da #0A0E14; işaret koyu zemine göre renklenir
    'splash-icon.svg': svg(1024, mark({ size: 1024, height: 600, sColor: c.splashS, plusColor: c.splashPlus })),
    // Favicon: küçük boyutta çizgiler kalınlaşır (okunurluk), işaret tuvalin %62'si
    'favicon.svg': svg(48, mark({ size: 48, height: 30, sColor: c.s, plusColor: c.plus, strokeScale: 1.1 }), c.bg),
  };
}

// ---- PNG yardımcıları (alfa kanalını atmak için; harici paket yok) ---------------
function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function pngInfo(buf) {
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20), depth: buf[24], colorType: buf[25] };
}
/** RGBA PNG → RGB PNG (24-bit, alfa yok). Zemin opak olduğundan alfa atılır. */
const toRgb = (buf) => recode(buf, 3);
/** RGB/RGBA PNG → RGBA PNG (32-bit). Play simgesi "32-bit PNG (with alpha)" ister; opak pikseller alfa 255 alır. */
const toRgba = (buf) => recode(buf, 4);
function recode(buf, outCh) {
  const { w, h, depth, colorType } = pngInfo(buf);
  if ((colorType === 2 && outCh === 3) || (colorType === 6 && outCh === 4)) return buf;
  if ((colorType !== 6 && colorType !== 2) || depth !== 8) throw new Error(`desteklenmeyen PNG: ct=${colorType} d=${depth}`);
  const inCh = colorType === 6 ? 4 : 3;
  const idat = [];
  for (let p = 8; p < buf.length;) {
    const len = buf.readUInt32BE(p); const type = buf.toString('ascii', p + 4, p + 8);
    if (type === 'IDAT') idat.push(buf.subarray(p + 8, p + 8 + len));
    p += 12 + len;
  }
  const raw = inflateSync(Buffer.concat(idat));
  const bpp = inCh, stride = w * bpp;
  const px = Buffer.alloc(h * stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? px[y * stride + x - bpp] : 0;
      const b = y > 0 ? px[(y - 1) * stride + x] : 0;
      const c = x >= bpp && y > 0 ? px[(y - 1) * stride + x - bpp] : 0;
      let v = line[x];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      px[y * stride + x] = v & 0xff;
    }
  }
  const row = w * outCh + 1;
  const out = Buffer.alloc(h * row);
  for (let y = 0; y < h; y++) {
    out[y * row] = 0;
    for (let x = 0; x < w; x++) {
      const s = y * stride + x * inCh, d = y * row + 1 + x * outCh;
      out[d] = px[s]; out[d + 1] = px[s + 1]; out[d + 2] = px[s + 2];
      if (outCh === 4) out[d + 3] = inCh === 4 ? px[s + 3] : 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = outCh === 4 ? 6 : 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([buf.subarray(0, 8), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(out, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

// ---- Çizim -----------------------------------------------------------------
const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });

async function renderSvg(svgText, size, file, { transparent = false, rgb = false, rgba = false, scale = 1 } = {}) {
  const px = size * scale;
  await page.setViewportSize({ width: px, height: px });
  await page.setContent(
    `<html><body style="margin:0;background:transparent"><img src="data:image/svg+xml;base64,${Buffer.from(svgText).toString('base64')}" width="${px}" height="${px}" style="display:block"></body></html>`,
  );
  await page.waitForFunction(() => document.images[0].complete);
  let png = await page.screenshot({ omitBackground: transparent, type: 'png', clip: { x: 0, y: 0, width: px, height: px } });
  if (rgb) png = toRgb(png);
  if (rgba) png = toRgba(png);
  writeFileSync(file, png);
  return png.length;
}

const report = [];
for (const [key, c] of Object.entries(CANDIDATES)) {
  const dir = join(OUT, key); mkdirSync(dir, { recursive: true });
  const src = sources(c);
  for (const [f, text] of Object.entries(src)) writeFileSync(join(dir, f), text);
  const jobs = [
    ['icon.svg', 1024, 'icon.png', {}],
    ['icon.svg', 1024, 'play-icon-512.png', { scale: 0.5, rgba: true }],
    ['adaptive-foreground.svg', 1024, 'adaptive-foreground.png', { transparent: true }],
    ['adaptive-background.svg', 1024, 'adaptive-background.png', {}],
    ['adaptive-monochrome.svg', 1024, 'adaptive-monochrome.png', { transparent: true }],
    ['splash-icon.svg', 1024, 'splash-icon.png', { transparent: true }],
    ['favicon.svg', 48, 'favicon.png', {}],
  ];
  for (const [s, size, out, opt] of jobs) {
    const bytes = await renderSvg(src[s], size, join(dir, out), opt);
    const info = pngInfo(readFileSync(join(dir, out)));
    report.push(`${key}/${out}\t${info.w}x${info.h}\tct=${info.colorType}\t${Math.ceil(bytes / 1024)} KB`);
  }
}

// ---- Önizleme sayfası: her aday × 48/96/192 × daire/squircle/yuvarlak kare × açık/koyu başlatıcı ----
// Başlatıcı maskeleri adaptif katmanın ortadaki 72/108'lik bölümünü gösterir.
const VIEW = 1024 * (72 / 108), OFF = (1024 - VIEW) / 2;
const MASKS = {
  daire: '<circle cx="50" cy="50" r="50"/>',
  squircle: '<path d="M50 0C88 0 100 12 100 50S88 100 50 100 0 88 0 50 12 0 50 0Z"/>',
  'yuvarlak kare': '<rect width="100" height="100" rx="22"/>',
};
function launcherIcon(key, mask, size) {
  const c = CANDIDATES[key];
  const id = `m${key}${mask.replace(/\W/g, '')}${size}`;
  const s = 100 / VIEW;
  const fg = mark({ size: 1024, height: ADAPTIVE_H, sColor: c.s, plusColor: c.plus });
  return `<svg width="${size}" height="${size}" viewBox="0 0 100 100"><defs><clipPath id="${id}">${MASKS[mask]}</clipPath></defs>` +
    `<g clip-path="url(#${id})"><rect width="100" height="100" fill="${c.bg}"/>` +
    `<g transform="scale(${s}) translate(${-OFF} ${-OFF})">${fg}</g></g></svg>`;
}
const sizes = [48, 96, 192];
let rows = '';
for (const key of Object.keys(CANDIDATES)) {
  for (const theme of ['light', 'dark']) {
    const bg = theme === 'light' ? '#E9EDF2' : '#1A1F26';
    const fg = theme === 'light' ? '#0A0E14' : '#E8EDF3';
    let cells = '';
    for (const mask of Object.keys(MASKS)) {
      cells += `<div class="cell"><div class="icons">${sizes.map((z) => launcherIcon(key, mask, z)).join('')}</div><div class="cap" style="color:${fg}">${mask}</div></div>`;
    }
    rows += `<div class="row" style="background:${bg}"><div class="label" style="color:${fg}"><b>${key} · ${CANDIDATES[key].name}</b><br>${theme === 'light' ? 'açık başlatıcı' : 'koyu başlatıcı'}</div>${cells}</div>`;
  }
}
const sheet = `<html><head><style>
body{margin:0;background:${T.bg};font-family:system-ui,'Segoe UI',sans-serif;padding:32px;width:1936px}
h1{color:${T.text};font-size:32px;margin:0 0 4px} p{color:${T.textMuted};font-size:16px;margin:0 0 24px}
.row{display:flex;align-items:center;gap:32px;padding:20px 24px;border-radius:16px;margin-bottom:12px}
.label{width:200px;font-size:18px;line-height:1.4}
.cell{display:flex;flex-direction:column;align-items:flex-start;gap:8px}
.icons{display:flex;align-items:flex-end;gap:20px} .cap{font-size:14px;opacity:.75}
</style></head><body><h1>Skor+ simge adayları</h1><p>Her aday 48 / 96 / 192 px; daire, squircle ve yuvarlak kare maskeleri; açık ve koyu başlatıcı zemini. Maskeler adaptif katmanın ortadaki 72 dp'lik bölümünü gösterir.</p>${rows}</body></html>`;
await page.setViewportSize({ width: 2000, height: 1200 });
await page.setContent(sheet);
const h = await page.evaluate(() => document.body.scrollHeight);
await page.setViewportSize({ width: 2000, height: h });
writeFileSync(join(OUT, 'preview.png'), toRgb(await page.screenshot({ type: 'png', fullPage: true })));

// ---- Öne çıkan grafik v2 ve reklam varlıkları (onaylı simge: A · Gece) ----------
// Dayanak: README "İkon onayı (pazarlama)" ve "İkon onayı (reklam)" bölümleri.
//   F1: uydurma rakam yok → soyut kart (rakamsız başlık, etiketsiz ve değersiz çubuklar)
//   F2 / pazarlama: rozet "✦ PRO · AI MAÇ ANALİZİ"; alt etiket "AI tarafından üretildi · Temsilî örnek", ≥18 px, ≥4.5:1
//   F3: mağaza sürümünde kart 40 px sola; reklam varlıkları 1200×628, 1200×1200, 1200×1500, %8 güvenli kenar
//   F4: reklamda metin yalnız wordmark + slogan (kartta yalnız zorunlu rozet ve etiket)
//   F5: reklamda "NBA" yok (alt satır kaldırıldı)
//   K1: koyu zeminde simge 2 px #2A3340 kenarlı yuvarlak karo içinde
const REC = 'A';
const rc = CANDIDATES[REC];
const tile = svg(1024, mark({ size: 1024, height: 1024 * FULL_RATIO, sColor: rc.s, plusColor: rc.plus }), rc.bg);
const tileSrc = `data:image/svg+xml;base64,${Buffer.from(tile).toString('base64')}`;
const K1_BORDER = '#2A3340';
const LABEL = '#C9D1DB'; // alt etiket rengi (surface #121821 üstünde ≈ 11.9:1)

function contrast(a, b) {
  const L = (hex) => {
    const [r, g, bl] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [x, y] = [L(a), L(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

/** Soyut AI kartı: rakam, takım adı, uydurma iddia yok. s = ölçek (1 = mağaza grafiği). headline: mağazada soru başlığı, reklamda yok. */
function cardHtml({ s = 1, headline = true }) {
  const px = (v) => `${Math.round(v * s)}px`;
  const ph = (w) => `<div style="height:${px(14)};width:${w}%;border-radius:${px(7)};background:${T.surfaceAlt};margin-bottom:${px(10)}"></div>`;
  const bar = (home) => `<div style="height:${px(12)};border-radius:${px(6)};background:${T.surfaceAlt};margin-bottom:${px(14)};overflow:hidden;display:flex">` +
    `<div style="width:${home}%;background:#4C8DFF"></div><div style="width:2%"></div><div style="flex:1;background:#FF7A45"></div></div>`;
  return `<div class="card" style="background:${T.surface};border:2px solid ${T.pro};border-radius:${px(28)};padding:${px(26)} ${px(26)} ${px(24)};box-shadow:0 ${px(24)} ${px(48)} rgba(0,0,0,.5)">
  <span style="display:inline-block;border:2px solid ${T.pro};color:${T.pro};border-radius:999px;padding:${px(5)} ${px(14)};font-size:${px(16)};font-weight:900;letter-spacing:.5px;white-space:nowrap">✦ PRO · AI MAÇ ANALİZİ</span>
  ${headline ? `<div style="color:${T.text};font-size:${px(28)};font-weight:900;line-height:${px(34)};margin:${px(16)} 0 ${px(16)}">Maç hangi anda koptu?</div>` : `<div style="height:${px(18)}"></div>`}
  ${ph(92)}${ph(78)}${ph(56)}
  <div style="height:${px(8)}"></div>
  ${bar(34)}${bar(68)}
  <div class="label" style="color:${LABEL};font-size:${Math.max(18, Math.round(18 * s))}px;font-weight:600;line-height:1.3;margin-top:${px(4)}">AI tarafından üretildi · Temsilî örnek</div>
</div>`;
}

const brandHtml = (tileSize, wordSize) =>
  `<div class="brand" style="display:flex;align-items:center;gap:${Math.round(tileSize * 0.23)}px">` +
  `<img src="${tileSrc}" style="width:${tileSize}px;height:${tileSize}px;border-radius:${Math.round(tileSize * 0.3)}px;box-shadow:0 0 0 2px ${K1_BORDER}">` +
  `<div style="font-size:${wordSize}px;font-weight:900;letter-spacing:-2px;color:${T.text};line-height:1">Skor<span style="color:${T.live}">+</span></div></div>`;

const page0 = (w, h, glow, body) => `<!doctype html><html lang="tr"><head><meta charset="utf-8"><style>
*{box-sizing:border-box} body{margin:0;width:${w}px;height:${h}px;overflow:hidden;font-family:'Segoe UI',system-ui,sans-serif;
background:radial-gradient(${glow.r}px ${glow.r}px at ${glow.x}px ${glow.y}px, rgba(245,196,81,.10), transparent 70%), ${T.bg};position:relative}
</style></head><body>${body}</body></html>`;

// Mağaza öne çıkan grafiği 1024×500 (kart 640 → 600 px, F3)
const fgHtml = page0(1024, 500, { r: 420, x: 730, y: 250 }, `
<div style="position:absolute;left:56px;top:40px;bottom:40px;width:520px;display:flex;flex-direction:column;justify-content:center;gap:18px">
  ${brandHtml(88, 88)}
  <div style="font-size:40px;font-weight:800;line-height:48px;color:${T.text}">Skoru herkes görür,<br>nedenini sen gör.</div>
  <div style="font-size:24px;font-weight:700;color:${T.textMuted}">Futbol · NBA · Türkçe AI</div>
</div>
<div style="position:absolute;left:600px;top:62px;width:350px;transform:rotate(-6deg)">${cardHtml({ s: 1, headline: true })}</div>`);

// Reklam varlıkları (F3–F5, K1). Metin: wordmark + slogan. Kartta yalnız zorunlu rozet + etiket.
const ADS = {
  'ad-1200x628': {
    w: 1200, h: 628,
    body: (m) => `
<div style="position:absolute;left:${m.x}px;top:${m.y}px;bottom:${m.y}px;width:560px;display:flex;flex-direction:column;justify-content:center;gap:28px">
  ${brandHtml(104, 108)}
  <div style="font-size:50px;font-weight:800;line-height:60px;color:${T.text}">Skoru herkes görür,<br>nedenini sen gör.</div>
</div>
<div style="position:absolute;right:${m.x + 24}px;top:${m.y + 40}px;width:400px;transform:rotate(-5deg)">${cardHtml({ s: 1.1, headline: false })}</div>`,
    glow: { r: 520, x: 880, y: 314 },
  },
  'ad-1200x1200': {
    w: 1200, h: 1200,
    body: (m) => `
<div style="position:absolute;left:${m.x}px;right:${m.x}px;top:${m.y + 40}px;display:flex;flex-direction:column;align-items:center;gap:36px;text-align:center">
  ${brandHtml(120, 124)}
  <div style="font-size:58px;font-weight:800;line-height:68px;color:${T.text}">Skoru herkes görür,<br>nedenini sen gör.</div>
</div>
<div style="position:absolute;left:50%;top:${Math.round(1200 * 0.5)}px;width:560px;transform:translateX(-50%) rotate(-4deg)">${cardHtml({ s: 1.45, headline: false })}</div>`,
    glow: { r: 640, x: 600, y: 860 },
  },
  'ad-1200x1500': {
    w: 1200, h: 1500,
    body: (m) => `
<div style="position:absolute;left:${m.x}px;right:${m.x}px;top:${m.y + 80}px;display:flex;flex-direction:column;align-items:center;gap:40px;text-align:center">
  ${brandHtml(132, 136)}
  <div style="font-size:64px;font-weight:800;line-height:76px;color:${T.text}">Skoru herkes görür,<br>nedenini sen gör.</div>
</div>
<div style="position:absolute;left:50%;top:${Math.round(1500 * 0.42)}px;width:640px;transform:translateX(-50%) rotate(-4deg)">${cardHtml({ s: 1.6, headline: false })}</div>`,
    glow: { r: 720, x: 600, y: 1060 },
  },
};

/** Sayfayı çizer; kart dâhil tüm üst öğelerin (döndürülmüş) sınır kutusunu güvenli alana göre denetler */
async function renderPage(html, w, h, margin) {
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(html);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => [...document.images].every((i) => i.complete));
  const boxes = await page.evaluate(() => [...document.body.children].map((e) => {
    const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom };
  }));
  const bad = boxes.filter((b) => b.l < margin.x - 0.5 || b.t < margin.y - 0.5 || b.r > w - margin.x + 0.5 || b.b > h - margin.y + 0.5);
  const label = await page.evaluate(() => {
    const e = document.querySelector('.label'); return e ? parseFloat(getComputedStyle(e).fontSize) : 0;
  });
  return { png: toRgb(await page.screenshot({ type: 'png' })), bad, boxes, label };
}

const checks = [];
checks.push(`Alt etiket kontrastı: ${LABEL} / surface ${T.surface} = ${contrast(LABEL, T.surface).toFixed(2)}:1`);

// Mağaza grafiği: Play kırpabilir; içerik kenardan ≥ 40 px içeride tutulur
const fg = await renderPage(fgHtml, 1024, 500, { x: 40, y: 40 });
writeFileSync(join(OUT, 'feature-graphic.png'), fg.png);
writeFileSync(join(OUT, 'feature-graphic.jpg'), await page.screenshot({ type: 'jpeg', quality: 92 }));
writeFileSync(join(OUT, 'feature-graphic.html'), fgHtml);
const fi = pngInfo(fg.png);
report.push(`feature-graphic.png\t${fi.w}x${fi.h}\tct=${fi.colorType}\t${Math.ceil(fg.png.length / 1024)} KB\tetiket ${fg.label}px\tkenar ihlali: ${fg.bad.length}${fg.bad.length ? " " + JSON.stringify(fg.bad) : ""}`);

mkdirSync(join(OUT, 'ads'), { recursive: true });
for (const [name, ad] of Object.entries(ADS)) {
  const m = { x: Math.round(ad.w * 0.08), y: Math.round(ad.h * 0.08) };
  const html = page0(ad.w, ad.h, ad.glow, ad.body(m));
  writeFileSync(join(OUT, 'ads', `${name}.html`), html);
  const r = await renderPage(html, ad.w, ad.h, m);
  writeFileSync(join(OUT, 'ads', `${name}.png`), r.png);
  const i = pngInfo(r.png);
  report.push(`ads/${name}.png\t${i.w}x${i.h}\tct=${i.colorType}\t${Math.ceil(r.png.length / 1024)} KB\tetiket ${r.label}px\t%8 kenar ihlali: ${r.bad.length}${r.bad.length ? ' ' + JSON.stringify(r.bad) : ''}`);
}

await browser.close();
console.log(report.join('\n'));
console.log(checks.join('\n'));
