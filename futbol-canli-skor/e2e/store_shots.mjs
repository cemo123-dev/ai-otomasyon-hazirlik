// Play Store ekran görüntüleri (docs/tasarim-rehberi.md "## Play Store görselleri" §1–§6).
// `npm run e2e` zincirinde DEĞİL; elle: node e2e/store_shots.mjs  (önizleme sunucusu :8084 açık olmalı)
// Çıktı: store/01-…08-*.png (1080×1920), store/feature-graphic.png (1024×500), store/alt-metinler.txt
// Uygulama `?store=1` ile açılır (src/lib/storeMode.ts): ÖNİZLEME rozeti, "Örnek veri" bandı, web bildirim notu,
// "Önizleme modundasın" yanıtı ve gerçek milli takım / UEFA maçları görünmez.
// Ortam: BASE_URL (varsayılan http://localhost:8084), PRO_PILL ("PRO · YAKINDA" varsayılan; satış açılınca "PRO"),
// HONESTY_NOTE=0 → "Örnek verilerle gösterilmiştir." notu basılmaz (karar: tasarım §7 madde 2).
// Pro simülasyonu olmayan karelerde tester=0: başlıktaki hap gerçek kullanıcıdaki gibi "✦ Pro · yakında" (satın alma çağrısı yok).
import { chromium } from 'playwright-core';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { crc32, deflateSync, inflateSync } from 'node:zlib';

const BASE = process.env.BASE_URL ?? 'http://localhost:8084';
const OUT = 'store/';
mkdirSync(OUT, { recursive: true });
const PRO_PILL = process.env.PRO_PILL ?? 'PRO · YAKINDA';
const NOTE = process.env.HONESTY_NOTE === '0' ? '' : 'Örnek verilerle gösterilmiştir.';
const FIXED = new Date('2026-11-18T21:47:00+03:00');
const errs = [];

// §3 tablo: dosya, altyazı (pazarlama §3.5), Pro hapı, alt metin (≤ 140)
const FRAMES = [
  { file: '01-ai-rapor.png', caption: 'Skoru herkes görür, nedenini sen gör', pro: true,
    alt: 'Futbol maçı sonrası Türkçe AI taktik raporu: xG ve momentum kırılma kartları.' },
  { file: '02-takip-listesi.png', caption: 'Takımın, maçların, tek ekranda', pro: false,
    alt: 'Bugünün maç listesi, takip edilen takımın maçı filtrelenmiş hâlde.' },
  { file: '03-nba-box-score.png', caption: "Gece maçının tam box score'u", pro: false,
    alt: 'NBA maçının box score tablosu: dakika, sayı, ribaund, asist, şut yüzdeleri.' },
  { file: '04-nba-ai.png', caption: "NBA'i Türkçe yorumla oku", pro: true,
    alt: 'NBA maçı için Türkçe AI analizi: şut verimliliği ve maçın koptuğu periyot.' },
  { file: '05-takim-takibi.png', caption: 'Takımını takip et, maç başlayınca haber al', pro: false, pending: true,
    alt: 'Maç ekranında takım takibi açık; maç başlayınca bildirim gelecek.' },
  { file: '06-kadro.png', caption: 'Kadro, diziliş, oyuncu puanları', pro: false,
    alt: 'Futbol maçı kadrosu: saha üzerinde diziliş ve maç sonu oyuncu puanları.' },
  { file: '07-bildirim-ayarlari.png', caption: 'Bildirimleri sen seç', pro: false, pending: true,
    alt: 'Bildirim ayarları: maç başladı bildirimi açık; diğer alarmlar yakında.' },
  { file: '08-taktik-asistan.png', caption: 'Maça özel sor: 3 soru, Türkçe cevap', pro: true,
    alt: 'Maça özel Taktik Asistan: Türkçe soru ve yapay zekâ yanıtı, kalan soru hakkı.' },
];
const FEATURE_ALT = 'Skor+ uygulama adı ve Türkçe AI maç analizi kartı; futbol ve NBA için.';

// ─────────────────────────────────────────────── tarayıcı
const b = await chromium.launch();
const app = await b.newContext({
  viewport: { width: 390, height: 607 },
  deviceScaleFactor: 900 / 390,
  locale: 'tr-TR',
  timezoneId: 'Europe/Istanbul',
  reducedMotion: 'reduce',
});

async function open(path) {
  const p = await app.newPage();
  p.on('pageerror', (e) => errs.push(`${path}: PAGEERROR ${e.message}`));
  await p.clock.setFixedTime(FIXED);
  await p.goto(`${BASE}${path}`, { timeout: 180000 });
  return p;
}
const vis = (loc) => loc.locator('visible=true').first();
async function proSim(p) {
  await vis(p.getByText('AI Taktik')).click();
  await p.getByRole('button', { name: /Pro/ }).first().click();
  await p.getByText('Aboneliği Başlat (Simülasyon)').click();
  await p.waitForTimeout(1500);
  if (await p.getByText('Aboneliği Başlat (Simülasyon)').count()) await p.goBack();
}
/** Öğeyi kaydırılabilir kabın üstüne getirir, sonra `offset` px aşağı bırakır (üstte bağlam kalsın) */
async function scrollTo(loc, offset = 0) {
  await loc.waitFor({ timeout: 30000 });
  await loc.evaluate((el, off) => {
    el.scrollIntoView({ block: 'start' });
    let s = el.parentElement;
    while (s && !(s.scrollHeight > s.clientHeight + 1 && /(auto|scroll)/.test(getComputedStyle(s).overflowY))) s = s.parentElement;
    if (s) s.scrollTop = Math.max(0, s.scrollTop - off);
  }, offset);
}
const FORBIDDEN_TEXT = ['ÖNİZLEME', 'Örnek veri ·', 'Önizleme modundasın', 'Web sürümünde'];
async function shoot(p, i) {
  await p.waitForTimeout(400);
  const text = await p.evaluate(() => document.body.innerText);
  for (const t of FORBIDDEN_TEXT) if (text.includes(t)) errs.push(`${FRAMES[i].file}: sayfada "${t}" var`);
  const buf = await p.screenshot({ type: 'png' });
  await p.close();
  return buf;
}

// ─────────────────────────────────────────────── 8 kare
const shots = [];
let featureCrop = null;

{ // 1) Maç sonu AI raporu (futbol): xG kicker'ı üst 1/3'te, altında momentum
  const p = await open('/match/9004?store=1&tester=1');
  await proSim(p);
  // Öne çıkan grafik için yalnız kart bölümü (skor başlığı / takım rozetleri yok): manşet + xG kartı
  const head = vis(p.getByText('✦ PRO TAKTİK HÜKÜM', { exact: true }));
  await scrollTo(head, 20);
  await p.waitForTimeout(300);
  const box = await head.boundingBox();
  const top = Math.max(0, Math.round(box.y - 20));
  featureCrop = await p.screenshot({ type: 'png', clip: { x: 0, y: top, width: 390, height: 607 - top } });
  await scrollTo(vis(p.getByText('XG & ŞUT KALİTESİ DENETİMİ', { exact: true })), 24);
  shots[0] = await shoot(p, 0);
}
{ // 2) Ana liste, Takip filtresi (Ege Yıldızı)
  const p = await open('/match/9001?store=1&tester=0');
  await vis(p.getByLabel('Ege Yıldızı takımını takip et')).click();
  await vis(p.getByLabel('Ege Yıldızı takibini bırak')).waitFor({ timeout: 10000 });
  await vis(p.getByText('‹ Maçlar', { exact: false })).click();
  await vis(p.getByText('★ Takip', { exact: true })).click();
  await vis(p.getByText('Ege Yıldızı')).waitFor({ timeout: 10000 });
  shots[1] = await shoot(p, 1);
}
{ // 3) NBA Box Score: tablo başlığı üst 1/4'te
  const p = await open('/match/9000009101?store=1&tester=0');
  await vis(p.getByRole('tab', { name: 'Box Score' })).click();
  await scrollTo(vis(p.getByText('TOPLAM')), 0); // tablo yüklendi
  await scrollTo(vis(p.getByText('PTS', { exact: true })), 70);
  shots[2] = await shoot(p, 2);
}
{ // 4) NBA AI analizi: TS% kartı görünür
  const p = await open('/match/9000009101?store=1&tester=1');
  await proSim(p);
  await scrollTo(vis(p.getByText('TS% & HÜCUM VERİMLİLİĞİ', { exact: true })), 24);
  shots[3] = await shoot(p, 3);
}
{ // 5) Varsayılan (ücretsiz API): takım takibi + takip bandı
  const p = await open('/match/9006?store=1&paid=0&tester=0');
  await vis(p.getByLabel('Anadolu Gücü takımını takip et')).click();
  await vis(p.getByLabel('Anadolu Gücü takibini bırak')).waitFor({ timeout: 10000 });
  await p.waitForTimeout(500);
  // Takım takibi maçı da takibe alır; bant hâlâ "takip et" diyorsa dokun
  const band = p.getByText('🔔 Maçı takip et · maç başlayınca bildirim al', { exact: true });
  if (await band.count()) await vis(band).click();
  await vis(p.getByText('🔔 Takip ediliyor · maç başlayınca bildirim gelir', { exact: true })).waitFor({ timeout: 10000 });
  shots[4] = await shoot(p, 4);
}
{ // 6) Futbol kadro: saha üst kenarı ekranın üstünde
  const p = await open('/match/9001?store=1&tester=0');
  await vis(p.getByRole('tab', { name: 'Kadro' })).click();
  await scrollTo(vis(p.getByLabel('Saha dizilişi')), 12);
  shots[5] = await shoot(p, 5);
}
{ // 7) Varsayılan: bildirim ayarları (yakında olanlar pasif ve etiketli)
  const p = await open('/settings?store=1&paid=0&tester=0');
  await vis(p.getByText('⚽ Maç Başladı')).waitFor({ timeout: 60000 });
  shots[6] = await shoot(p, 6);
}
{ // 8) Taktik Asistan: 1 soru + yanıt, "Kalan: 2/3"
  const p = await open('/match/9004?store=1&tester=1');
  await proSim(p);
  await vis(p.getByText('Maçın kırılma anı neydi?')).click();
  await p.getByText('Maç verisine bakılıyor…').waitFor({ state: 'detached', timeout: 15000 });
  await vis(p.getByText('Kalan: 2/3')).waitFor({ timeout: 5000 });
  await scrollTo(vis(p.getByText('TAKTİK ASİSTANA SOR', { exact: true })), 16);
  shots[7] = await shoot(p, 7);
}
await app.close();

// ─────────────────────────────────────────────── bileşim (§2)
const comp = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
const b64 = (buf) => `data:image/png;base64,${buf.toString('base64')}`;
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const frameHtml = (f, img) => `<!doctype html><html lang="tr"><head><meta charset="utf-8"><style>
  html,body{margin:0;width:1080px;height:1920px;overflow:hidden;background:#0A0E14;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif}
  .glow{position:absolute;left:0;top:0;width:1080px;height:460px;
    background:radial-gradient(circle 700px at 540px 0,${f.pro ? 'rgba(245,196,81,0.10)' : '#121821'},#0A0E14)}
  .top{position:absolute;left:72px;right:72px;top:72px;height:388px;display:flex;flex-direction:column;align-items:center;gap:28px}
  .pill{font-size:28px;font-weight:900;color:#0A0E14;background:#F5C451;border-radius:999px;padding:14px 28px;line-height:1}
  .cap{font-size:64px;font-weight:900;line-height:76px;color:#E8EDF3;text-align:center;margin:0}
  .shot{position:absolute;left:90px;top:460px;width:900px;height:1400px;border:2px solid #232D3A;border-bottom:0;
    border-radius:48px 48px 0 0;overflow:hidden;box-sizing:border-box}
  .shot img{display:block;width:896px;height:auto}
  .note{position:absolute;left:0;right:0;bottom:0;height:86px;background:rgba(10,14,20,0.85)}
  .note span{position:absolute;left:0;right:0;bottom:32px;text-align:center;font-size:22px;line-height:22px;color:#7D8A9C}
</style></head><body><div class="glow"></div>
  <div class="top">${f.pro ? `<div class="pill">${esc(PRO_PILL)}</div>` : ''}<h1 class="cap" id="cap">${esc(f.caption)}</h1></div>
  <div class="shot"><img src="${b64(img)}"></div>
  ${NOTE ? `<div class="note"><span>${esc(NOTE)}</span></div>` : ''}
</body></html>`;

async function render(html, file, w, h) {
  await comp.setViewportSize({ width: w, height: h });
  await comp.setContent(html, { waitUntil: 'load' });
  await comp.evaluate(() => document.fonts.ready);
  // 3. satıra inen altyazı 56 px'e iner (kısaltılmaz)
  await comp.evaluate(() => {
    const c = document.getElementById('cap');
    if (c && c.getBoundingClientRect().height > 76 * 2 + 4) { c.style.fontSize = '56px'; c.style.lineHeight = '66px'; }
  });
  const png = await comp.screenshot({ type: 'png', omitBackground: false });
  writeFileSync(OUT + file, toRgbPng(png));
}

for (let i = 0; i < FRAMES.length; i++) await render(frameHtml(FRAMES[i], shots[i]), FRAMES[i].file, 1080, 1920);

// ─────────────────────────────────────────────── öne çıkan grafik (§4)
const featureHtml = `<!doctype html><html lang="tr"><head><meta charset="utf-8"><style>
  html,body{margin:0;width:1024px;height:500px;overflow:hidden;background:#0A0E14;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif}
  .glow{position:absolute;inset:0;background:radial-gradient(circle 420px at 760px 250px,rgba(245,196,81,0.10),rgba(10,14,20,0))}
  .left{position:absolute;left:56px;top:0;bottom:0;width:520px;display:flex;flex-direction:column;justify-content:center;gap:18px}
  .brand{font-size:96px;font-weight:900;line-height:1;color:#E8EDF3;margin:0}
  .brand b{color:#2BE37A}
  .slogan{font-size:40px;font-weight:800;line-height:48px;color:#E8EDF3;margin:0}
  .sub{font-size:24px;font-weight:700;color:#8A97A8;margin:0}
  .phone{position:absolute;left:660px;top:90px;width:300px;height:470px;border:2px solid #232D3A;border-radius:36px;overflow:hidden;
    transform:rotate(-6deg);box-shadow:0 24px 48px rgba(0,0,0,0.5);background:#0A0E14}
  .phone img{display:block;width:300px;height:auto}
</style></head><body><div class="glow"></div>
  <div class="left"><p class="brand">Skor<b>+</b></p><p class="slogan">Skoru herkes görür,<br>nedenini sen gör.</p><p class="sub">Futbol · NBA · Türkçe AI</p></div>
  <div class="phone"><img src="${b64(featureCrop)}"></div>
</body></html>`;
await render(featureHtml, 'feature-graphic.png', 1024, 500);
await b.close();

writeFileSync(
  OUT + 'alt-metinler.txt',
  [
    '# Skor+ Play Store görselleri — alt metinler (≤ 140 karakter) ve altyazılar',
    '# Kaynak: docs/tasarim-rehberi.md "Play Store görselleri" §3. ⚠ = pazarlama onayı bekleyen altyazı (§7 madde 3).',
    `# Pro hapı: "${PRO_PILL}". Dürüstlük notu: ${NOTE ? `"${NOTE}"` : 'yok'} (§7 madde 2 kararı bekliyor).`,
    '',
    ...FRAMES.map((f) => `${f.file}\n  altyazı: ${f.caption}${f.pending ? ' (⚠ öneri)' : ''}${f.pro ? `  [${PRO_PILL}]` : ''}\n  alt metin: ${f.alt}`),
    `feature-graphic.png\n  alt metin: ${FEATURE_ALT}`,
    '',
  ].join('\n'),
);

// ─────────────────────────────────────────────── doğrulama (§6 madde 5; sharp yok, PNG başlığından)
const FORBIDDEN_WORDS = [/en iyi/i, /#1/, /\byeni\b/i, /\bindir/i, /\bhemen\b/i, /ücretsiz/i, /\banlık\b/i, /₺/, /\bTL\b/];
for (const f of FRAMES) {
  for (const w of FORBIDDEN_WORDS) if (w.test(f.caption) || w.test(f.alt)) errs.push(`${f.file}: yasaklı ifade ${w}`);
  if (f.alt.length > 140) errs.push(`${f.file}: alt metin ${f.alt.length} > 140`);
}
const files = [...FRAMES.map((f) => [f.file, 1080, 1920]), ['feature-graphic.png', 1024, 500]];
for (const [file, w, h] of files) {
  const d = readFileSync(OUT + file);
  const width = d.readUInt32BE(16), height = d.readUInt32BE(20), colorType = d[25], depth = d[24];
  const ok = width === w && height === h && colorType === 2 && depth === 8;
  if (!ok) errs.push(`${file}: ${width}×${height} renk türü ${colorType} derinlik ${depth}`);
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${OUT}${file}  ${width}×${height}  RGB(alfa yok)=${colorType === 2}  ${Math.round(d.length / 1024)} KB`);
}
if (!FRAMES.every((f, i) => f.file.startsWith(String(i + 1).padStart(2, '0') + '-'))) errs.push('dosya adları 01–08 değil');
console.log(`${OUT}alt-metinler.txt`);
console.log('hatalar:', errs.length ? errs : 'yok');
if (errs.length) process.exit(1);

// ─────────────────────────────────────────────── PNG: RGBA → RGB (24-bit, alfa yok; Play şartı)
// Chromium ekran görüntüsünü renk türü 6 (RGBA) yazar. Zemin opak olduğundan alfa atılır, veri yeniden sıkıştırılır.
function toRgbPng(png) {
  const SIG = png.subarray(0, 8);
  let off = 8, ihdr = null;
  const idat = [];
  while (off < png.length) {
    const len = png.readUInt32BE(off), type = png.toString('latin1', off + 4, off + 8);
    const data = png.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') ihdr = data;
    else if (type === 'IDAT') idat.push(data);
    off += 12 + len;
  }
  const w = ihdr.readUInt32BE(0), h = ihdr.readUInt32BE(4), depth = ihdr[8], ct = ihdr[9], interlace = ihdr[12];
  if (ct === 2) return png;
  if (ct !== 6 || depth !== 8 || interlace !== 0) throw new Error(`beklenmeyen PNG biçimi: tür ${ct}, derinlik ${depth}, interlace ${interlace}`);
  const raw = inflateSync(Buffer.concat(idat));
  const bpp = 4, stride = w * bpp;
  const out = Buffer.alloc(h * (1 + w * 3));
  let prev = Buffer.alloc(stride), cur = Buffer.alloc(stride);
  for (let y = 0; y < h; y++) {
    const ft = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? cur[x - bpp] : 0, bb = prev[x], c = x >= bpp ? prev[x - bpp] : 0;
      let v = line[x];
      if (ft === 1) v += a;
      else if (ft === 2) v += bb;
      else if (ft === 3) v += (a + bb) >> 1;
      else if (ft === 4) { const pp = a + bb - c, pa = Math.abs(pp - a), pb = Math.abs(pp - bb), pc = Math.abs(pp - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? bb : c; }
      cur[x] = v & 255;
    }
    const o = y * (1 + w * 3);
    out[o] = 0;
    for (let x = 0; x < w; x++) { out[o + 1 + x * 3] = cur[x * 4]; out[o + 2 + x * 3] = cur[x * 4 + 1]; out[o + 3 + x * 3] = cur[x * 4 + 2]; }
    [prev, cur] = [cur, prev];
  }
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type, 'latin1'), data]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td) >>> 0);
    return Buffer.concat([len, td, crc]);
  };
  const hdr = Buffer.from(ihdr); hdr[9] = 2;
  return Buffer.concat([SIG, chunk('IHDR', hdr), chunk('IDAT', deflateSync(out, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}
