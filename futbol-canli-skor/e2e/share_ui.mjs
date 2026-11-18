// F3 Paylaş + Davet kodu (önizleme verisi). navigator.share taklit edilir: react-native-web Share.share
// paylaşılan metni navigator.share'e verir; test son paylaşılanı okur.
// Spesifikasyon: docs/inovasyon-onerileri.md §4.3 "E2E", tasarım tur 2 §D-1/D-2/D-3.
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
const BASE = process.env.BASE_URL ?? 'http://localhost:8084';
const OUT = 'e2e/shots/'; mkdirSync(OUT, { recursive: true });
const b = await chromium.launch();
const errs = [];
const page = async (w = 390) => {
  const p = await b.newPage({ viewport: { width: w, height: 844 }, deviceScaleFactor: 2 });
  p.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
  p.on('console', (m) => m.type() === 'error' && errs.push(m.text().slice(0, 200)));
  await p.addInitScript(() => {
    window.__shared = [];
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: (d) => {
        window.__shared.push(d);
        return Promise.resolve();
      },
    });
  });
  return p;
};
const lastShared = (p) => p.evaluate(() => { const d = window.__shared.at(-1); return d?.text ?? d?.message ?? ''; });
const sharedCount = (p) => p.evaluate(() => window.__shared.length);
const must = (cond, msg) => { if (!cond) throw new Error(msg); };
// Pazarlama §8 listesi uygulamayla aynı kaynaktan (Döngü 6 bulgu 12); Node 22.18+ .ts tiplerini atar
const { findBannedShareTerms } = await import('../src/lib/share.ts');
const BANNED = { test: (t) => findBannedShareTerms(t).length > 0 };
const shareBtn = (p) => p.getByRole('button', { name: 'Maçı paylaş' });

const p = await page();

// 1) NBA biten maç
await p.goto(`${BASE}/match/9000009101`, { timeout: 180000 });
await p.getByRole('tab', { name: 'Özet' }).waitFor({ timeout: 150000 });
await shareBtn(p).waitFor({ timeout: 10000 });
// Döngü 6 bulgu 6–7: kod yalnız basınca istenir ve beklenir; hemen basışta da k= gelir
await shareBtn(p).click();
await p.waitForFunction(() => window.__shared.length > 0, null, { timeout: 5000 });
let t = await lastShared(p);
console.log('NBA paylaşım metni:\n' + t);
must(/\(MS\)/.test(t), 'NBA: (MS) yok');
must(/En skorer: .+ \d+ sayı/.test(t), 'NBA: En skorer satırı yok');
must(/\/m\/\?id=9000009101&ref=app-share&k=ABC234/.test(t), 'NBA: bağlantı biçimi yanlış');
must(!BANNED.test(t), 'NBA: yasaklı ifade');
await p.screenshot({ path: OUT + 'f3-paylas-nba.png' });

// 2) Futbol biten maç (9001)
await p.goto(`${BASE}/match/9001`, { timeout: 60000 });
await p.getByRole('tab', { name: 'Özet' }).waitFor({ timeout: 30000 });
await shareBtn(p).click();
await p.waitForTimeout(300);
t = await lastShared(p);
console.log('futbol paylaşım metni:\n' + t);
must(/^.+ \d+-\d+ .+ \(MS/.test(t), 'futbol: skor satırı yok');
must(/En yüksek puan: .+ \(\d+,\d\)/.test(t), 'futbol: En yüksek puan satırı yok');
must(!/Maçın oyuncusu/.test(t) && !BANNED.test(t), 'futbol: yasaklı ifade');
must(/ref=app-share&k=ABC234/.test(t), 'futbol: ref/k yok');

// 3) Canlı maç: düğme yok
await p.goto(`${BASE}/match/9006`, { timeout: 60000 });
await p.getByRole('tab', { name: 'Özet' }).waitFor({ timeout: 30000 });
await p.waitForTimeout(500);
must((await shareBtn(p).count()) === 0, 'canlı maçta Paylaş görünüyor');
console.log('canlı maçta Paylaş yok: OK');

// 4) Başlamamış maç
await p.goto(`${BASE}/match/9005`, { timeout: 60000 });
await p.getByRole('tab', { name: 'Özet' }).waitFor({ timeout: 30000 });
const before = await sharedCount(p);
await shareBtn(p).click();
await p.waitForFunction((n) => window.__shared.length > n, before, { timeout: 5000 });
t = await lastShared(p);
console.log('başlamamış maç metni:\n' + t);
must(/Skor\+'ta takip ediyorum: /.test(t), 'NS: takip satırı yok');
must(/(bugün|yarın|\d{2}\.\d{2}) \d{2}:\d{2}/.test(t), 'NS: saat yok');
// Başlamamış maçta Timeline boş durumu (tasarım tur 2 R-1)
must(await p.getByText('Maç başlamadı', { exact: true }).count(), 'NS: "Maç başlamadı" yok');
must((await p.getByText('0 kritik olay').count()) === 0, 'NS: "0 kritik olay" yazıyor');
console.log('Timeline "Maç başlamadı": OK');
await p.getByText('Maç başlamadı', { exact: true }).scrollIntoViewIfNeeded();
await p.screenshot({ path: OUT + 'r1-mac-baslamadi.png' });

// 5) Ayarlar davet kartı
await p.goto(`${BASE}/settings`, { timeout: 60000 });
await p.getByText('Arkadaşını davet et').waitFor({ timeout: 30000 });
await p.getByText('ABC 234', { exact: true }).waitFor({ timeout: 10000 });
must(await p.getByLabel('Davet kodun A B C 2 3 4').count(), 'kod erişilebilirlik etiketi yok');
await p.getByText('Davetinle gelen: 4 · Aktif olan: 2').waitFor({ timeout: 5000 });
await p.getByText('Aktif 3 davet → Pro satışa açılmadan önce denemeye davet edilirsin.').waitFor({ timeout: 5000 });
must(!(await p.getByText(/ücretsiz pro|kazan|ödül/i).count()), 'kartta yasaklı ifade');
await p.getByText('Davet kodun var mı?').scrollIntoViewIfNeeded();
await p.screenshot({ path: OUT + 'f3-davet.png' });
await p.getByRole('button', { name: 'Davetiye gönder' }).click();
await p.waitForTimeout(300);
t = await lastShared(p);
console.log('davetiye metni:\n' + t);
must(/\?ref=invite&k=ABC234/.test(t) && !t.includes('/m/'), 'davetiye bağlantısı yanlış');
must(/davet kodum: ABC234/.test(t), 'davetiye metninde kod yok');

// 6) Kod girme
const input = p.getByLabel('Davet kodu', { exact: true });
const save = p.getByRole('button', { name: 'Kaydet' });
await input.fill('zzz');
must(await save.isDisabled(), 'Kaydet geçersiz kodda etkin');
await input.fill('ABO234');
must(await save.isDisabled(), 'Kaydet ABO234 ile etkin');
await p.getByText('Kodlarda 0, 1, I, L ve O harfi yoktur.').waitFor({ timeout: 3000 });
await input.fill(' abc 234 ');
must(!(await save.isDisabled()), 'Kaydet " abc 234 " ile pasif');
await save.click();
await p.getByText('Kendi kodunu giremezsin.').waitFor({ timeout: 5000 });
await input.fill('QWE234');
await save.click();
await p.getByText('Kod bulunamadı.').waitFor({ timeout: 5000 });
await input.fill('XYZ789');
await save.click();
await p.getByText('Teşekkürler, davet kaydedildi.').waitFor({ timeout: 5000 });
await p.waitForTimeout(500);
must((await input.count()) === 0, 'ok sonrası giriş alanı hâlâ görünüyor');
console.log('kod girme: self / invalid / ok: OK');
await p.getByText('Teşekkürler, davet kaydedildi.').scrollIntoViewIfNeeded();
await p.screenshot({ path: OUT + 'f3-davet-kaydedildi.png' });

// 7) Dar ekran (360 pt): taşma yok; başlıkta "‹ Maçlar", başlık ve Paylaş çakışmıyor
const n = await page(360);
await n.goto(`${BASE}/settings`, { timeout: 60000 });
await n.getByText('Arkadaşını davet et').waitFor({ timeout: 30000 });
const sw = await n.evaluate(() => document.documentElement.scrollWidth);
must(sw <= 360, `ayarlar 360'ta taşıyor: ${sw}`);
await n.goto(`${BASE}/match/9000009101`, { timeout: 60000 });
await shareBtn(n).waitFor({ timeout: 30000 });
const share = await shareBtn(n).boundingBox();
const back = await n.getByRole('button', { name: 'Maçlar listesine dön' }).boundingBox();
must(share.x + share.width <= 360, 'Paylaş ekran dışında');
must(back.x + back.width <= share.x, '"‹ Maçlar" ile Paylaş çakışıyor');
console.log('360 pt: taşma yok, başlık düğmeleri ayrık: OK');
await n.screenshot({ path: OUT + 'f3-paylas-360.png' });

// 8) İndirme adresi yok (?dl=0) → Paylaş ve kart yok; 0017 yok (?invite=0) → kart yok, Paylaş k'siz
await n.goto(`${BASE}/match/9001?dl=0`, { timeout: 60000 });
await n.getByRole('tab', { name: 'Özet' }).waitFor({ timeout: 30000 });
await n.waitForTimeout(500);
must((await shareBtn(n).count()) === 0, 'dl=0: Paylaş görünüyor');
await n.goto(`${BASE}/settings?dl=0`, { timeout: 60000 });
await n.getByText('TAKIMLARIM').waitFor({ timeout: 30000 });
must((await n.getByText('Arkadaşını davet et').count()) === 0, 'dl=0: davet kartı görünüyor');
await n.goto(`${BASE}/settings?invite=0`, { timeout: 60000 });
await n.getByText('TAKIMLARIM').waitFor({ timeout: 30000 });
await n.waitForTimeout(500);
must((await n.getByText('Arkadaşını davet et').count()) === 0, 'invite=0: davet kartı görünüyor');
await n.goto(`${BASE}/match/9001?invite=0`, { timeout: 60000 });
await shareBtn(n).click();
await n.waitForFunction(() => window.__shared.length > 0, null, { timeout: 5000 });
t = await lastShared(n);
must(/ref=app-share/.test(t) && !/k=/.test(t), `invite=0: bağlantıda k var: ${t}`);
console.log("indirme adresi yok / 0017 yok: Paylaş ve kart gizli, bağlantı k'siz: OK");

// 9) Davet bilgisi ağ hatası → kart içinde uyarı bandı, "Tekrar dene" toparlar
await n.goto(`${BASE}/settings?mockFail=invite`, { timeout: 60000 });
await n.getByText('⚠ Davet bilgisi yüklenemedi').waitFor({ timeout: 30000 });
await n.evaluate(() => { globalThis.__skorMockOk = true; });
await n.getByRole('button', { name: 'Davet bilgisini yeniden yükle' }).click();
await n.getByText('ABC 234', { exact: true }).waitFor({ timeout: 10000 });
console.log('davet yükleme hatası + Tekrar dene: OK');

// 10) KVKK (Döngü 6 bulgu 5): 3'ten az davetli → "Aktif olan" ve noktalar gizli
await n.goto(`${BASE}/settings?invite=few`, { timeout: 60000 });
await n.getByText('Davetinle gelen: 2', { exact: true }).waitFor({ timeout: 30000 });
must((await n.getByText(/Aktif olan/).count()) === 0, 'invite=few: "Aktif olan" görünüyor');
await n.getByText('Aktif sayısı, davetinle en az 3 kişi gelince görünür.').waitFor({ timeout: 5000 });
await n.getByText('Davetinle gelen: 2', { exact: true }).scrollIntoViewIfNeeded();
await n.screenshot({ path: OUT + 'c6-davet-az-davetli.png' });
console.log('3 davetliden az: aktif sayacı gizli: OK');

console.log('hatalar:', errs.length ? errs.join(' | ') : 'yok');
await b.close();
if (errs.length) process.exit(1);
