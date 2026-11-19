// Döngü 10 — F7 "Hata bildir": her AI yüzeyinde bağlantı + sayfa (neden, 200 karakter not), sonuç metinleri,
// 0020 kurulmamış (?aireport=0) ve günlük sınır (?aireport=limit) durumları, 360 px + büyük yazı (x1.3) taşma kontrolü.
// Gönderilen bildirimler önizlemede globalThis.__skorAiReports'ta (mockSource) okunur.
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
const BASE = process.env.BASE_URL ?? 'http://localhost:8084';
const OUT = 'e2e/shots/'; mkdirSync(OUT, { recursive: true });
const b = await chromium.launch();
const errs = [];
const page = async (w = 390, h = 844) => {
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
  p.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
  p.on('console', (m) => m.type() === 'error' && errs.push(m.text().slice(0, 200)));
  return p;
};
const check = (ok, label, extra = '') => {
  if (ok) console.log(`${label}: OK${extra ? ' ' + extra : ''}`);
  else errs.push(`${label} ${extra}`);
};
const proSim = async (p) => {
  await p.getByText('AI Taktik').click();
  await p.getByRole('button', { name: /Pro/ }).first().click();
  await p.getByText('Aboneliği Başlat (Simülasyon)').click();
  await p.waitForTimeout(1500);
  if (await p.getByText('Aboneliği Başlat (Simülasyon)').count()) await p.goBack();
};
const reports = (p) => p.evaluate(() => globalThis.__skorAiReports ?? []);
const reportBtn = (p) => p.getByRole('button', { name: 'Hata bildir', exact: true });

// 1) Maç sonu futbol raporu: sayfa, Gönder pasif → neden seç, 200 karakter not, teşekkür, "Bildirildi"
const p = await page();
await p.goto(`${BASE}/match/9004`, { timeout: 180000 });
await proSim(p);
await p.getByText('TAKTİK ASİSTANA SOR', { exact: true }).first().waitFor({ timeout: 30000 });
check((await reportBtn(p).count()) === 1, 'maç sonu raporu: tek "Hata bildir"');
await reportBtn(p).click();
await p.getByText('Bu AI içeriğinde ne sorunlu?').waitFor({ timeout: 5000 });
const radios = await p.getByRole('radio').allTextContents();
check(radios.join('|') === 'Yanlış bilgi|Uygunsuz içerik|Futbol-basketbol terimi karışık|Diğer', 'dört neden', JSON.stringify(radios));
check((await p.getByRole('button', { name: 'Bildirimi gönder' }).getAttribute('aria-disabled')) === 'true', 'neden seçilmeden Gönder pasif');
await p.getByRole('radio', { name: 'Futbol-basketbol terimi karışık' }).click();
check((await p.getByRole('radio', { name: 'Futbol-basketbol terimi karışık' }).getAttribute('aria-checked')) === 'true', 'seçili neden aria-checked');
await p.getByLabel('Not, isteğe bağlı').fill('x'.repeat(250));
const noteLen = (await p.getByLabel('Not, isteğe bağlı').inputValue()).length;
check(noteLen === 200, 'not 200 karakterle sınırlı', String(noteLen));
await p.getByText('200/200', { exact: false }).waitFor({ timeout: 3000 });
await p.screenshot({ path: OUT + 'r1-hata-bildir.png' });
await p.getByRole('button', { name: 'Bildirimi gönder' }).click();
await p.getByText('Teşekkürler. Bildirimin bize ulaştı', { exact: false }).waitFor({ timeout: 5000 });
await p.getByRole('button', { name: 'Kapat', exact: true }).click();
await p.getByRole('button', { name: 'Hata bildirildi' }).waitFor({ timeout: 3000 });
let r = await reports(p);
check(r.length === 1 && r[0].surface === 'analysis' && r[0].reason === 'sport_mixup' && r[0].fixtureId === 9004 && r[0].note?.length === 200 && r[0].itemRef === null,
  'bildirim kaydı (analysis)', JSON.stringify(r.map(({ note, ...x }) => ({ ...x, note: note?.length }))));

// 2) Asistan yanıtı: her yanıtın altında ayrı bağlantı (öğe = mesaj kimliği), not boş → null; Vazgeç kaydetmez
await p.getByText('Maçın kırılma anı neydi?').click();
await p.getByText('Maç verisine bakılıyor…').waitFor({ state: 'detached', timeout: 10000 });
await reportBtn(p).first().waitFor({ timeout: 5000 });
check((await reportBtn(p).count()) === 1, 'asistan yanıtında "Hata bildir"');
await reportBtn(p).click();
await p.getByRole('button', { name: 'Vazgeç' }).click();
check((await reports(p)).length === 1, 'Vazgeç bildirim göndermez');
await reportBtn(p).click();
await p.getByRole('radio', { name: 'Yanlış bilgi' }).click();
await p.getByRole('button', { name: 'Bildirimi gönder' }).click();
await p.getByText('Teşekkürler.', { exact: false }).waitFor({ timeout: 5000 });
await p.getByRole('button', { name: 'Kapat', exact: true }).click();
r = await reports(p);
check(r.length === 2 && r[1].surface === 'assistant' && r[1].reason === 'wrong_info' && r[1].note === null && /^\d+$/.test(r[1].itemRef ?? ''),
  'bildirim kaydı (assistant)', JSON.stringify(r[1]));
await p.screenshot({ path: OUT + 'r2-asistan-bildirildi.png' });
await p.close();

// 3) Diğer yüzeyler: maç önü, NBA maç sonu, devre arası, kırmızı kart analizi
{
  const q = await page();
  await q.goto(`${BASE}/match/9005`, { timeout: 180000 });
  await proSim(q);
  await q.getByText('KIRILMA SENARYOSU', { exact: true }).waitFor({ timeout: 30000 });
  check((await reportBtn(q).count()) === 1, 'maç önü raporunda "Hata bildir"');
  await reportBtn(q).click();
  await q.getByRole('radio', { name: 'Uygunsuz içerik' }).click();
  await q.getByRole('button', { name: 'Bildirimi gönder' }).click();
  await q.getByText('Teşekkürler.', { exact: false }).waitFor({ timeout: 5000 });
  check((await reports(q))[0]?.surface === 'preview', 'bildirim kaydı (preview)');
  await q.getByRole('button', { name: 'Kapat', exact: true }).click();

  await q.goto(`${BASE}/match/9000009101`, { timeout: 180000 });
  await proSim(q);
  await reportBtn(q).first().waitFor({ timeout: 30000 });
  await reportBtn(q).first().click();
  await q.getByRole('radio', { name: 'Diğer' }).click();
  await q.getByRole('button', { name: 'Bildirimi gönder' }).click();
  await q.getByText('Teşekkürler.', { exact: false }).waitFor({ timeout: 5000 });
  check((await reports(q))[0]?.surface === 'nba_analysis', 'NBA maç sonu raporunda "Hata bildir"');
  await q.getByRole('button', { name: 'Kapat', exact: true }).click();
  await q.close();
}
{
  const q = await page();
  await q.goto(`${BASE}/match/9006`, { timeout: 180000 });
  await q.getByText('AI Taktik').click();
  await q.getByText("Pro'ya Geçerek Raporu Aç").click();
  await q.getByText('Aboneliği Başlat (Simülasyon)').click();
  await q.getByText('İKİNCİ YARIDA NE OLMALI?', { exact: true }).waitFor({ timeout: 20000 });
  check((await reportBtn(q).count()) === 1, 'devre arası raporunda "Hata bildir"');
  await q.close();
}
{
  const q = await page();
  await q.goto(`${BASE}/match/9010`, { timeout: 180000 });
  await q.getByText('🔒 Canlı taktik analiz Pro üyelere özel').click();
  await q.getByText('Aboneliği Başlat (Simülasyon)').click();
  await q.waitForTimeout(1500);
  if (await q.getByText('Aboneliği Başlat (Simülasyon)').count()) await q.goBack();
  await q.getByText('✦ Canlı taktik analizi gör').click();
  await q.getByText('İskoçya 10 Kişi: Kanatlar Açıldı').waitFor({ timeout: 10000 });
  await reportBtn(q).click();
  await q.getByRole('radio', { name: 'Yanlış bilgi' }).click();
  await q.getByRole('button', { name: 'Bildirimi gönder' }).click();
  await q.getByText('Teşekkürler.', { exact: false }).waitFor({ timeout: 5000 });
  const rr = (await reports(q))[0];
  check(rr?.surface === 'red_card' && rr?.itemRef != null, 'kırmızı kart analizinde "Hata bildir"', JSON.stringify(rr));
  await q.close();
}

// 4) 0020 kurulmamış / günlük sınır: uygulama bozulmaz, açıklayıcı metin
for (const [mode, text] of [['0', 'Bildirim şu an alınamıyor'], ['limit', 'bildirim sınırına ulaştın']]) {
  const q = await page();
  await q.goto(`${BASE}/match/9005?aireport=${mode}`, { timeout: 180000 });
  await proSim(q);
  await reportBtn(q).waitFor({ timeout: 30000 });
  await reportBtn(q).click();
  await q.getByRole('radio', { name: 'Yanlış bilgi' }).click();
  await q.getByRole('button', { name: 'Bildirimi gönder' }).click();
  await q.getByText(text, { exact: false }).waitFor({ timeout: 5000 });
  await q.getByRole('button', { name: 'Kapat', exact: true }).click();
  check((await reportBtn(q).count()) === 1, `?aireport=${mode}: metin + bağlantı açık kalır`);
  await q.close();
}

// 5) 360 px + büyük yazı (x1.3): sayfada yatay taşma / kırpılma yok
{
  const q = await page(360, 780);
  await q.goto(`${BASE}/match/9005`, { timeout: 180000 });
  await proSim(q);
  await reportBtn(q).waitFor({ timeout: 30000 });
  await reportBtn(q).click();
  await q.getByText('Bu AI içeriğinde ne sorunlu?').waitFor({ timeout: 5000 });
  const bad = await q.evaluate((s) => {
    for (const el of document.querySelectorAll('div[dir="auto"], span')) {
      const fs = parseFloat(getComputedStyle(el).fontSize);
      if (fs) el.style.fontSize = `${fs * s}px`;
    }
    const out = [];
    for (const el of document.querySelectorAll('div[dir="auto"], span')) {
      const rc = el.getBoundingClientRect();
      if (!rc.width || !el.textContent?.trim()) continue;
      if (rc.right > 361) out.push(el.textContent.trim().slice(0, 40));
    }
    return [...new Set(out)];
  }, 1.3);
  check(!bad.length, '360 px + x1.3: taşma yok', JSON.stringify(bad));
  await q.getByRole('button', { name: 'Bildirimi gönder' }).scrollIntoViewIfNeeded();
  await q.screenshot({ path: OUT + 'r3-hata-bildir-360-buyukyazi.png' });
  await q.close();
}

console.log('hatalar:', errs.length ? errs : 'yok'); await b.close(); if (errs.length) process.exit(1);
