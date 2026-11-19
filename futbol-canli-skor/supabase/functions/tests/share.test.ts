// src/lib/share.ts (F3 paylaşım + davet metinleri) — saf modül, Deno'dan doğrudan içe aktarılır.
// Çalıştırma: npm run test:functions. Plan: docs/inovasyon-onerileri.md §4.3 "Test planı";
// bağlantı biçimi tasarım tur 2 §D-1 (matchLink, F13 kararı).
import { assert, assertEquals } from 'jsr:@std/assert@1';
import {
  BANNED_SHARE_TERMS,
  buildInviteText,
  buildShareText,
  BANNED_TERM_ALLOW,
  findBannedShareTerms,
  isPlayStoreUrl,
  groupInviteCode,
  hasForeignInviteChar,
  INVITE_ALPHABET,
  isValidInviteCode,
  kickoffLabel,
  matchLink,
  normalizeInviteInput,
  redeemMessage,
  type RedeemResult,
  type ShareMatch,
  shareKind,
  topRatingLine,
  topScorerLine,
  withRef,
} from '../../../src/lib/share.ts';
import { hasFootballTerm } from '../_shared/sportTerms.ts';

const U = 'https://x.dev/skor';
const NOW = Date.parse('2026-11-18T09:00:00Z'); // TSİ 12:00
const O = { downloadUrl: U, inviteCode: 'ABC234', nowMs: NOW };

const box = (name: string, points: number, minutes: number, fgm = 0, fga = 0) => ({ name, points, minutes, fgm, fga });

const nba = (patch: Partial<ShareMatch> = {}): ShareMatch => ({
  fixture_id: 9000009101,
  sport_type: 'nba',
  home_team: 'Lakeshore Comets',
  away_team: 'Desert Vipers',
  home_score: 104,
  away_score: 99,
  status_short: 'FT',
  kickoff_at: '2026-11-18T01:00:00Z',
  box_score: [box('K. Lee', 18, 30, 7, 12), box('J. Smith', 31, 36, 11, 21), box('M. Diaz', 22, 34, 8, 15)],
  ...patch,
});

const foot = (patch: Partial<ShareMatch> = {}): ShareMatch => ({
  fixture_id: 9001,
  sport_type: 'football',
  home_team: 'Ege Yıldızı',
  away_team: 'Boğaziçi SK',
  home_score: 2,
  away_score: 1,
  status_short: 'FT',
  kickoff_at: '2026-11-18T16:00:00Z',
  player_ratings: [
    { name: 'B. Kaya', rating: 7.6 },
    { name: 'A. Yılmaz', rating: 8.4 },
  ],
  ...patch,
});

Deno.test('davet kodu: normalize + geçerlilik + alfabe', () => {
  assertEquals(normalizeInviteInput(' abc 234 '), 'ABC234');
  assertEquals(normalizeInviteInput('abc\t234\n'), 'ABC234');
  assertEquals(isValidInviteCode('ABC234'), true);
  assertEquals(isValidInviteCode('ABC123'), false); // 1
  assertEquals(isValidInviteCode('ABCO23'), false); // O
  assertEquals(isValidInviteCode('ABC23'), false); // 5 karakter
  assertEquals(isValidInviteCode('ABCI23'), false); // I
  assertEquals(isValidInviteCode('ABCL23'), false); // L
  assertEquals(isValidInviteCode('ABC023'), false); // 0
  // Alfabedeki her harf geçerli, alfabe dışı hiçbir büyük harf/rakam geçerli değil
  for (const c of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789') {
    assertEquals(isValidInviteCode(`${c}${c}${c}234`), INVITE_ALPHABET.includes(c), c);
  }
  assertEquals(INVITE_ALPHABET.length, 31);
  assertEquals(hasForeignInviteChar('abo234'), true);
  assertEquals(hasForeignInviteChar(' abc 234 '), false);
  assertEquals(hasForeignInviteChar('çğı'), true); // Türkçe harf alfabede yok
  assertEquals(groupInviteCode('ABC234'), 'ABC 234');
  // Gruplu kod geri yapıştırılınca yine geçerli
  assertEquals(isValidInviteCode(normalizeInviteInput(groupInviteCode('ABC234'))), true);
});

Deno.test('shareKind: yalnız biten ve başlamamış maç', () => {
  const k = (s: string) => shareKind({ status_short: s });
  assertEquals(['FT', 'AET', 'PEN'].map(k), ['finished', 'finished', 'finished']);
  assertEquals(['NS', 'TBD'].map(k), ['upcoming', 'upcoming']);
  assertEquals(['1H', 'HT', 'PST', 'Q3', 'LIVE', 'CANC', 'SUSP', 'ABD', ''].map(k), Array(9).fill(null));
});

Deno.test('withRef: davet bağlantısı, sorgu ve # korunur', () => {
  assertEquals(withRef(U, 'invite', 'ABC234'), 'https://x.dev/skor?ref=invite&k=ABC234');
  assertEquals(withRef(U, 'app-share', 'ABC234'), 'https://x.dev/skor?ref=app-share&k=ABC234');
  assertEquals(withRef('https://x.dev/?lang=tr#kur', 'invite', null), 'https://x.dev/?lang=tr&ref=invite#kur');
  // Eski ref/k parametresi tekrarlanmaz
  assertEquals(withRef('https://x.dev/?ref=x&k=OLD', 'invite', 'ABC234'), 'https://x.dev/?ref=invite&k=ABC234');
});

Deno.test('matchLink: tek /m/, k yalnız kod varsa (tasarım §D-1)', () => {
  assertEquals(matchLink('https://x.dev/skor', 42, 'ABC234'), 'https://x.dev/skor/m/?id=42&ref=app-share&k=ABC234');
  assertEquals(matchLink('https://x.dev/skor/', 42, null), 'https://x.dev/skor/m/?id=42&ref=app-share');
  assertEquals(matchLink('https://x.dev', 7, null), 'https://x.dev/m/?id=7&ref=app-share');
  assertEquals(matchLink('https://x.dev//', 7, null), 'https://x.dev/m/?id=7&ref=app-share');
  assertEquals(matchLink(' https://x.dev/skor?lang=tr#kur ', 42, 'ABC234'), 'https://x.dev/skor/m/?lang=tr&id=42&ref=app-share&k=ABC234#kur');
});

Deno.test('NBA biten: box score metni', () => {
  assertEquals(
    buildShareText(nba(), O),
    'Lakeshore Comets 104-99 Desert Vipers (MS)\n' +
      'En skorer: J. Smith 31 sayı, FG% 52\n' +
      "Box score Skor+'ta: https://x.dev/skor/m/?id=9000009101&ref=app-share&k=ABC234",
  );
});

Deno.test('topScorerLine: eşit sayıda dakikası çok olan, fga = 0 ise FG% yok', () => {
  assertEquals(topScorerLine([box('A', 20, 30, 8, 16), box('B', 20, 35, 9, 18)]), 'En skorer: B 20 sayı, FG% 50');
  assertEquals(topScorerLine([box('A', 20, 30), box('B', 20, 30)]), 'En skorer: A 20 sayı'); // tam eşitlik: ilk sıra
  assertEquals(topScorerLine([box('X', 2, 10, 0, 0)]), 'En skorer: X 2 sayı');
  assertEquals(topScorerLine([]), null);
  assertEquals(topScorerLine(null), null);
});

Deno.test('NBA biten, box yok: 2 satır', () => {
  for (const b of [[], null]) {
    const t = buildShareText(nba({ box_score: b }), { ...O, inviteCode: null })!;
    assertEquals(t.split('\n').length, 2);
    assertEquals(t.split('\n')[1], "Skor ve istatistik Skor+'ta: https://x.dev/skor/m/?id=9000009101&ref=app-share");
  }
});

Deno.test('futbol biten: en yüksek puan, ondalık virgül', () => {
  assertEquals(
    buildShareText(foot(), O),
    'Ege Yıldızı 2-1 Boğaziçi SK (MS)\nEn yüksek puan: A. Yılmaz (8,4)\n' +
      "Kadro ve puanlar Skor+'ta: https://x.dev/skor/m/?id=9001&ref=app-share&k=ABC234",
  );
  assertEquals(topRatingLine([{ name: 'A. Yılmaz', rating: 7 }]), 'En yüksek puan: A. Yılmaz (7,0)');
  assertEquals(topRatingLine([]), null);
});

Deno.test('futbol biten, puan yok: maç özeti', () => {
  const t = buildShareText(foot({ player_ratings: null }), O)!;
  assertEquals(t, "Ege Yıldızı 2-1 Boğaziçi SK (MS)\nMaç özeti Skor+'ta: https://x.dev/skor/m/?id=9001&ref=app-share&k=ABC234");
});

Deno.test('uzatma ve penaltılar', () => {
  assert(buildShareText(foot({ status_short: 'AET' }), O)!.startsWith('Ege Yıldızı 2-1 Boğaziçi SK (MS, uzatma)\n'));
  assert(buildShareText(foot({ status_short: 'PEN' }), O)!.startsWith('Ege Yıldızı 2-1 Boğaziçi SK (MS, penaltılar)\n'));
});

Deno.test('başlamamış maç: bugün / yarın / tarih (TSİ)', () => {
  const ns = (iso: string) => buildShareText(foot({ status_short: 'NS', kickoff_at: iso, home_score: null, away_score: null }), O)!;
  assertEquals(ns('2026-11-18T18:45:00Z'), "Ege Yıldızı – Boğaziçi SK, bugün 21:45\nSkor+'ta takip ediyorum: https://x.dev/skor/m/?id=9001&ref=app-share&k=ABC234");
  assert(ns('2026-11-18T21:30:00Z').includes(', yarın 00:30\n'));
  assert(ns('2026-11-20T18:45:00Z').includes(', 20.11 21:45\n'));
  assertEquals(kickoffLabel('2026-11-17T20:59:00Z', NOW), '17.11 23:59'); // dün: tarih
  // Gece yarısı sınırı: TSİ 23:59 bugün, 00:00 yarın
  assertEquals(kickoffLabel('2026-11-18T20:59:00Z', NOW), 'bugün 23:59');
  assertEquals(kickoffLabel('2026-11-18T21:00:00Z', NOW), 'yarın 00:00');
  // Saati belli olmayan maç: yalnız gün
  const tbd = buildShareText(foot({ status_short: 'TBD', kickoff_at: '2026-11-19T00:00:00Z' }), O)!;
  assert(tbd.startsWith('Ege Yıldızı – Boğaziçi SK, yarın, saat belli değil\n'), tbd);
});

Deno.test('canlı / ertelenen maç ve boş indirme adresi: metin yok', () => {
  assertEquals(buildShareText(foot({ status_short: '1H' }), O), null);
  assertEquals(buildShareText(foot({ status_short: 'HT' }), O), null);
  assertEquals(buildShareText(foot({ status_short: 'PST' }), O), null);
  assertEquals(buildShareText(nba({ status_short: 'LIVE' }), O), null);
  assertEquals(buildShareText(foot(), { ...O, downloadUrl: '  ' }), null);
});

Deno.test('biten maçta skor yoksa metin yok (gerçek olmayan 0-0 paylaşılmaz)', () => {
  assertEquals(buildShareText(foot({ home_score: null }), O), null);
  assertEquals(buildShareText(foot({ away_score: null }), O), null);
  assertEquals(buildShareText(nba({ home_score: null, away_score: null }), O), null);
  // 0-0 gerçek skor ise yazılır
  assert(buildShareText(foot({ home_score: 0, away_score: 0 }), O)!.startsWith('Ege Yıldızı 0-0 Boğaziçi SK (MS)\n'));
});

Deno.test('NBA uzatma: (MS, uzatma) — çeyrek sayısı > 4 ya da "Maç Sonu (UZ)"', () => {
  const ot = { home: [25, 25, 25, 25, 9], away: [25, 25, 25, 25, 4] };
  assert(buildShareText(nba({ period_scores: ot }), O)!.startsWith('Lakeshore Comets 104-99 Desert Vipers (MS, uzatma)\n'));
  assert(buildShareText(nba({ status_detail: 'Maç Sonu (UZ)' }), O)!.startsWith('Lakeshore Comets 104-99 Desert Vipers (MS, uzatma)\n'));
  const reg = { home: [25, 25, 25, 29], away: [25, 25, 25, 24] };
  assert(buildShareText(nba({ period_scores: reg, status_detail: 'Maç Sonu' }), O)!.startsWith('Lakeshore Comets 104-99 Desert Vipers (MS)\n'));
  assertEquals(hasFootballTerm(buildShareText(nba({ period_scores: ot }), O)!), false);
});

Deno.test('findBannedShareTerms: §8 listesi, sözcük sınırlı', () => {
  for (const t of ['Canlı skor', 'en hızlı skor', 'dakika dakika', 'gol bildirimi', 'baskı alarmı', 'kupon yap', 'iyi oran',
    'en iyi uygulama', '1 numara', "Türkiye'nin ilk", "TÜRKİYE'NİN TEK", '%100 güvenli', 'maç biter bitmez']) {
    assert(findBannedShareTerms(t).length > 0, t);
  }
  // Fiil çekimi ve başka sözcük içinde geçen kökler yakalanmaz
  for (const t of ['kazandı', 'Kurulum anlatımı burada', '21 numaralı forma', 'tahminen 3 gün', 'kesinleşti']) {
    assertEquals(findBannedShareTerms(t), [], t);
  }
});

// Döngü 7 bulgu 9: önceden kaçan biçimler artık yakalanır
Deno.test('findBannedShareTerms: ASCII büyük I, Türkçe ekler, akıllı kesme, boşluk farkı', () => {
  const caught: [string, string][] = [
    // ASCII büyük I (tr küçültme I → ı yapar; kök küçültme de denenir)
    ['IDDAA', 'iddaa'], ['TAHMIN', 'tahmin'], ['KESIN', 'kesin'], ['GARANTI', 'garanti'], ['RESMI', 'resmi'],
    ['FIYAT', 'fiyat'], ['BIRAZDAN', 'birazdan'], ['TAHMİN', 'tahmin'], ['KESİN SONUÇ', 'kesin'],
    // Türkçe ekler
    ['maçın tahmini', 'tahmin'], ['oranı yüksek', 'oran'], ['günün kuponu', 'kupon'], ['canlıda izle', 'canlı'],
    ['garantili kazanç', 'garanti'], ['kesinlikle izle', 'kesin'], ['bahisçi dostu', 'bahis'], ['tahminler', 'tahmin'],
    // Akıllı kesme işareti (U+2019) ve kesmesiz yazım
    ['Türkiye’nin ilk skor uygulaması', "türkiye'nin ilk"], ['Türkiyenin tek uygulaması', "türkiye'nin tek"],
    // Boşluk / tire farkı
    ['en  iyi uygulama', 'en iyi'], ['en iyi uygulama', 'en iyi'], ['gerçek-zamanlı skor', 'gerçek zamanlı'],
    ['dakika dakika', 'dakika dakika'], ['maç  biter	bitmez', 'maç biter bitmez'],
  ];
  for (const [t, term] of caught) {
    assert(findBannedShareTerms(t).includes(term), `${t} → ${term} bekleniyordu, gelen ${JSON.stringify(findBannedShareTerms(t))}`);
  }
});

// Döngü 7 bulgu 10 + Döngü 7 doğrulanan yanlış pozitif listesi: gerçek adlar temiz kalır
Deno.test('findBannedShareTerms: takım / yer adlarında yanlış pozitif yok', () => {
  for (const t of ['Moran', 'Oranje 1-0 Belçika', 'Kazanspor', 'Kesinoglu', 'Resmiye', 'Canlıspor', 'En İyilerspor',
    'MC Oran 1-0 USM Alger (MS)', 'Rubin Kazan 2-1 Zenit (MS)', 'RUBIN KAZAN', 'oran23']) {
    assertEquals(findBannedShareTerms(t), [], t);
  }
  assert(BANNED_TERM_ALLOW.includes('mc oran'));
  // ignore: maçın takım adları kontrol dışı; metnin geri kalanı yine denetlenir
  assertEquals(findBannedShareTerms('Oran FC 2-0 Kupon SK (MS)', ['Oran FC', 'Kupon SK']), []);
  assertEquals(findBannedShareTerms('Oran FC 2-0 Kupon SK — kesin tahmin', ['Oran FC', 'Kupon SK']), ['tahmin', 'kesin']);
  assertEquals(findBannedShareTerms('Oran FC 2-0 Kupon SK (MS)'), ['kupon', 'oran']);
});

// Döngü 8 bulgu 9: ünsüz yumuşaması / ünlü düşmesi / fiil kökleri yakalanır; özel adlar ignore ile temiz
Deno.test('findBannedShareTerms: canlılığı, kesinliği, bahsi/bahse, resmen, kazandırıyor, resmîleşti', () => {
  const caught: [string, string][] = [
    ['Skorun canlılığı', 'canlı'], ['sonucun kesinliği', 'kesin'], ['maçın bahsi', 'bahis'], ['bahse gir', 'bahis'],
    ['resmen açıklandı', 'resmi'], ['RESMEN', 'resmi'], ['her hafta kazandırıyor', 'kazandırır'], ['kazandıran kupon', 'kazandırır'],
    ['ortaklık resmîleşti', 'resmî'], ['ortaklık resmileşti', 'resmi'], ['CANLILIĞI', 'canlı'], ['kesinliğe', 'kesin'],
  ];
  for (const [t, term] of caught) {
    assert(findBannedShareTerms(t).includes(term), `${t} → ${term} bekleniyordu, gelen ${JSON.stringify(findBannedShareTerms(t))}`);
  }
  // Önceden temiz olanlar temiz kalır (Döngü 8'de doğrulanan liste)
  for (const t of ['Oranje', 'Canlıspor', 'Kazanspor', 'Rubin Kazan 1-0 Zenit', 'RUBIN KAZAN', 'MC Oran', 'Orange Vélodrome',
    'Karl-Anthony Towns', 'Alperen Şengün', 'Kazanan', 'Tahminen', 'Kesintisiz', 'Orantılı', 'Bodø/Glimt', 'Qarabağ',
    'kesinleşti', 'kazandı', 'konudan bahsetti', 'bahsedilen maç']) {
    assertEquals(findBannedShareTerms(t), [], t);
  }
  // Takip dışı kulüp izin listesinde
  assertEquals(findBannedShareTerms('ASM Oran 0-0 MC Oran (MS)'), []);
  assert(BANNED_TERM_ALLOW.includes('asm oran'));
});

Deno.test('findBannedShareTerms: oyuncu adları (golcü, maçın oyuncusu) ignore ile temiz', () => {
  const t = "Ödül Spor 2-1 Kazan FK (MS)\nGoller: Mehmet Kazancı 23', Ali Ödül 67', Can Oran 88'";
  const names = ['Ödül Spor', 'Kazan FK', 'Mehmet Kazancı', 'Ali Ödül', 'Can Oran'];
  // ignore olmadan soyadlar yasaklı kök içerir (yanlış pozitif): bu yüzden testler adları ignore'a geçer
  assertEquals(findBannedShareTerms(t), ['kazan', 'oran', 'ödül']);
  assertEquals(findBannedShareTerms(t, names), []);
  // ignore yalnız adları çıkarır; metnin geri kalanı yine denetlenir
  assertEquals(findBannedShareTerms(`${t} — kesin kazandırıyor`, names), ['kesin', 'kazandırır']);
});

Deno.test("Play Store'da artık yasaklı değil (pazarlama Sürüm 3)", () => {
  assertEquals(findBannedShareTerms("Skor+ Play Store'da"), []);
  assertEquals(findBannedShareTerms("Skor+ Google Play'den indir"), []);
});

const fixtures = (): string[] => [
  buildShareText(nba(), O)!,
  buildShareText(nba({ box_score: null }), O)!,
  buildShareText(nba({ status_short: 'NS' }), O)!,
  buildShareText(foot(), O)!,
  buildShareText(foot({ player_ratings: null, status_short: 'AET' }), O)!,
  buildShareText(foot({ status_short: 'PEN' }), O)!,
  buildShareText(foot({ status_short: 'NS' }), O)!,
  buildInviteText(U, 'ABC234'),
];

Deno.test('yasaklı ifadeler hiçbir metinde yok (pazarlama §8)', () => {
  assert(BANNED_SHARE_TERMS.length >= 30);
  for (const t of fixtures()) assertEquals(findBannedShareTerms(t), [], t);
  assert(!/maçın oyuncusu/i.test(fixtures().join('\n')));
});

Deno.test('NBA metinlerinde futbol terimi yok', () => {
  for (const t of [buildShareText(nba(), O)!, buildShareText(nba({ box_score: null }), O)!, buildShareText(nba({ status_short: 'NS' }), O)!]) {
    assertEquals(hasFootballTerm(t), false, t);
  }
});

Deno.test('davetiye metni birebir; /m/ yok; APK dili yok (Döngü 7 bulgu 12)', () => {
  const t = buildInviteText(U, 'ABC234');
  assertEquals(
    t,
    'Türkçe, reklamsız skor uygulaması Skor+. İndir: https://x.dev/skor?ref=invite&k=ABC234 — Uygulamayı açınca davet kodum: ABC234',
  );
  assert(!t.includes('/m/'));
  assert(!/kurulum anlatımı|apk/i.test(t));
  const PLAY = 'https://play.google.com/store/apps/details?id=com.skorplus.app';
  assert(isPlayStoreUrl(PLAY));
  assertEquals(isPlayStoreUrl(U), false);
  assertEquals(isPlayStoreUrl('https://play.google.com.evil.dev/x'), false);
  const p = buildInviteText(PLAY, 'ABC234');
  assertEquals(
    p,
    "Türkçe, reklamsız skor uygulaması Skor+. Google Play'den indir: https://play.google.com/store/apps/details?id=com.skorplus.app&referrer=utm_source%3Dapp%26utm_medium%3Dinvite%26utm_campaign%3Dinvite%26utm_content%3DABC234 — Uygulamayı açınca davet kodum: ABC234",
  );
  assertEquals(findBannedShareTerms(p), []);
});

Deno.test('redeemMessage: metinler ve bayraklar', () => {
  const want: Record<RedeemResult, [string, boolean, string, boolean]> = {
    ok: ['Teşekkürler, davet kaydedildi.', true, 'ok', true],
    invalid: ['Kod bulunamadı.', false, 'error', false],
    self: ['Kendi kodunu giremezsin.', false, 'error', false],
    too_late: ['Davet kodu yalnız ilk 7 günde girilebilir.', false, 'info', true],
    already: ['Bu hesapta zaten bir davet kodu kayıtlı.', false, 'info', true],
    not_allowed: ['Bu kod bu hesapta kullanılamaz.', false, 'error', false],
    rate_limited: ['Çok fazla deneme yapıldı. Yarın tekrar dene.', false, 'error', false],
    unauthenticated: ['Kod kaydedilemedi. Tekrar dene.', false, 'error', false],
  };
  for (const [r, [text, ok, tone, closeInput]] of Object.entries(want) as [RedeemResult, [string, boolean, string, boolean]][]) {
    assertEquals(redeemMessage(r), { result: r, text, ok, tone: tone as 'ok' | 'error' | 'info', closeInput }, r);
  }
});
