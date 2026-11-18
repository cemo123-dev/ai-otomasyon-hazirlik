/**
 * F3 Paylaş + Davet kodu — SAF modül (React Native içe aktarmaz; Deno test eder:
 * supabase/functions/tests/share.test.ts). Bu yüzden başka modülden içe aktarma yok: Deno, uzantısız
 * yolları ('./status') çözemez. Maç alanları yapısal tiple alınır; `Match` buna uyar.
 *
 * Metin kuralları: docs/inovasyon-onerileri.md §4.3 ("Arayüz metinleri (son hâl)") ve
 * docs/tasarim-rehberi.md "Tasarım incelemesi (tur 2)" §D. Yasaklı ifadeler: pazarlama stratejisi §8.
 */

/** Davet kodu alfabesi: 0/O ve 1/I/L karışmasın diye yoklar (0017'deki CHECK ile aynı) */
export const INVITE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const INVITE_RE = /^[A-HJKMNP-Z2-9]{6}$/;

export type RedeemResult = 'ok' | 'already' | 'too_late' | 'invalid' | 'self' | 'not_allowed' | 'rate_limited' | 'unauthenticated';

/** Paylaşım metni için gereken maç alanları (`Match` yapısal olarak uyar) */
export type ShareMatch = {
  fixture_id: number;
  sport_type: 'football' | 'nba';
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  status_short: string;
  kickoff_at: string;
  box_score?: { name: string; minutes: number; points: number; fgm: number; fga: number }[] | null;
  player_ratings?: { name: string; rating: number }[] | null;
  /** NBA uzatması: sunucu `status_short = 'FT'` yazar; uzatma yalnız çeyrek sayısında (> 4) ve "Maç Sonu (UZ)"da */
  period_scores?: { home: number[]; away: number[] } | null;
  status_detail?: string | null;
};
export type ShareKind = 'finished' | 'upcoming';

/** Boşlukları atar, büyük harfe çevirir: ' abc 234 ' → 'ABC234'. Alfabe yalnız ASCII; Türkçe i/ı sorunu yok. */
export function normalizeInviteInput(raw: string): string {
  return String(raw ?? '')
    .replace(/\s+/g, '')
    .toUpperCase();
}

export const isValidInviteCode = (code: string): boolean => INVITE_RE.test(code);

/** Girdide alfabe dışı karakter var mı (ipucu: "Kodlarda 0, 1, I, L ve O harfi yoktur.") */
export const hasForeignInviteChar = (raw: string): boolean => /[^A-HJKMNP-Z2-9]/.test(normalizeInviteInput(raw));

/** Ekranda okunurluk için 3+3: "ABC234" → "ABC 234" */
export const groupInviteCode = (code: string): string => (code.length === 6 ? `${code.slice(0, 3)} ${code.slice(3)}` : code);

const FINISHED = ['FT', 'AET', 'PEN'];
const UPCOMING = ['NS', 'TBD'];

/** Yalnız biten (FT/AET/PEN) ve başlamamış (NS/TBD) maç paylaşılır; canlı / ertelenen / bilinmeyen → null */
export function shareKind(m: { status_short: string }): ShareKind | null {
  if (FINISHED.includes(m.status_short)) return 'finished';
  if (UPCOMING.includes(m.status_short)) return 'upcoming';
  return null;
}

/** "base?query#hash" → parçalar (URL API'ye bağımlı kalmamak için elle; RN çalışma zamanı farkları) */
function splitUrl(url: string): { base: string; query: string[]; hash: string } {
  const hashAt = url.indexOf('#');
  const hash = hashAt >= 0 ? url.slice(hashAt) : '';
  const rest = hashAt >= 0 ? url.slice(0, hashAt) : url;
  const qAt = rest.indexOf('?');
  const base = qAt >= 0 ? rest.slice(0, qAt) : rest;
  const query = qAt >= 0 ? rest.slice(qAt + 1).split('&').filter(Boolean) : [];
  return { base, query, hash };
}

/** Mevcut sorgu ve # korunur; aynı adlı eski parametreler atılır; `undefined/null` değer eklenmez */
function withParams(url: string, params: [string, string | number | null | undefined][], path?: (base: string) => string): string {
  const { base, query, hash } = splitUrl(url.trim());
  const names = new Set(params.map(([k]) => k));
  const kept = query.filter((q) => !names.has(decodeURIComponent(q.split('=')[0])));
  const added = params
    .filter(([, v]) => v != null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  const all = [...kept, ...added];
  return `${path ? path(base) : base}${all.length ? `?${all.join('&')}` : ''}${hash}`;
}

/** İndirme sayfası + kaynak etiketi: `<url>?ref=invite&k=ABC234`. code null ise k eklenmez. */
export function withRef(downloadUrl: string, ref: 'app-share' | 'invite', code: string | null): string {
  return withParams(downloadUrl, [
    ['ref', ref],
    ['k', code],
  ]);
}

/**
 * Paylaşılan maç bağlantısı (F13 kararı, OTA gerektirmesin diye ilk günden):
 * `<DOWNLOAD_URL>/m/?id=<fixture_id>&ref=app-share&k=<kod>`. Sondaki `/` olsa da olmasa da tek `/m/`.
 */
export function matchLink(downloadUrl: string, fixtureId: number, code: string | null): string {
  return withParams(
    downloadUrl,
    [
      ['id', fixtureId],
      ['ref', 'app-share'],
      ['k', code],
    ],
    (base) => `${base.replace(/\/+$/, '')}/m/`,
  );
}

/** "En skorer: J. Smith 31 sayı, FG% 52" — sıralama: sayı ↓, dakika ↓, ilk sıra; fga = 0 ise FG% yazılmaz */
export function topScorerLine(box: ShareMatch['box_score']): string | null {
  if (!box?.length) return null;
  let best = box[0];
  for (const p of box.slice(1)) {
    if (p.points > best.points || (p.points === best.points && p.minutes > best.minutes)) best = p;
  }
  const fg = best.fga > 0 ? `, FG% ${Math.round((best.fgm / best.fga) * 100)}` : '';
  return `En skorer: ${best.name} ${best.points} sayı${fg}`;
}

/** "En yüksek puan: A. Yılmaz (8,4)" — ondalık virgül, tek basamak ("Maçın oyuncusu" denmez: resmî ödül iması) */
export function topRatingLine(ratings: ShareMatch['player_ratings']): string | null {
  const valid = (ratings ?? []).filter((r) => Number.isFinite(r.rating));
  if (!valid.length) return null;
  let best = valid[0];
  for (const r of valid.slice(1)) if (r.rating > best.rating) best = r;
  return `En yüksek puan: ${best.name} (${best.rating.toFixed(1).replace('.', ',')})`;
}

// Türkiye 2016'dan beri sabit UTC+3 (yaz saati yok) — src/lib/days.ts ile aynı kabul
const TSI_MS = 3 * 3600_000;
const DAY_MS = 86_400_000;
const pad = (n: number) => String(n).padStart(2, '0');

/** "bugün 21:45" | "yarın 00:30" | "20.11 21:45" — TSİ */
export function kickoffLabel(kickoffIso: string, nowMs: number): string {
  const k = new Date(Date.parse(kickoffIso) + TSI_MS);
  const dayK = Math.floor((Date.parse(kickoffIso) + TSI_MS) / DAY_MS);
  const dayN = Math.floor((nowMs + TSI_MS) / DAY_MS);
  const time = `${pad(k.getUTCHours())}:${pad(k.getUTCMinutes())}`;
  if (dayK === dayN) return `bugün ${time}`;
  if (dayK === dayN + 1) return `yarın ${time}`;
  return `${pad(k.getUTCDate())}.${pad(k.getUTCMonth() + 1)} ${time}`;
}

/** Saati belli olmayan maç: yalnız gün */
function dayOnlyLabel(kickoffIso: string, nowMs: number): string {
  const full = kickoffLabel(kickoffIso, nowMs);
  return `${full.slice(0, full.lastIndexOf(' '))}, saat belli değil`;
}

/** NBA maçı uzatmaya gitti mi (ekrandaki "Maç Sonu (UZ)" ile aynı bilgi) */
const nbaOvertime = (m: ShareMatch): boolean =>
  (m.period_scores?.home?.length ?? 0) > 4 || /\(UZ\)/.test(m.status_detail ?? '');

/**
 * Paylaşım metni. Satır sırası sabit; eksik satır boş satır bırakmaz. Canlı / ertelenen maçta null.
 * Biten maçta skorlardan biri yoksa (veri gecikmesi) da null: gerçek olmayan "0-0" paylaşılmaz,
 * "Paylaş" düğmesi de çizilmez.
 * NBA metninde futbol terimi yok; hiçbir metinde "canlı", "anlık", "Maçın oyuncusu" yok.
 */
export function buildShareText(m: ShareMatch, o: { downloadUrl: string; inviteCode: string | null; nowMs: number }): string | null {
  const kind = shareKind(m);
  if (!kind || !o.downloadUrl.trim()) return null;
  const url = matchLink(o.downloadUrl, m.fixture_id, o.inviteCode);
  if (kind === 'upcoming') {
    const when = m.status_short === 'TBD' ? dayOnlyLabel(m.kickoff_at, o.nowMs) : kickoffLabel(m.kickoff_at, o.nowMs);
    return [`${m.home_team} – ${m.away_team}, ${when}`, `Skor+'ta takip ediyorum: ${url}`].join('\n');
  }
  if (m.home_score == null || m.away_score == null) return null;
  const suffix =
    m.sport_type === 'nba'
      ? nbaOvertime(m)
        ? 'MS, uzatma'
        : 'MS'
      : m.status_short === 'AET'
        ? 'MS, uzatma'
        : m.status_short === 'PEN'
          ? 'MS, penaltılar'
          : 'MS';
  const score = `${m.home_score}-${m.away_score}`;
  const lines = [`${m.home_team} ${score} ${m.away_team} (${suffix})`];
  if (m.sport_type === 'nba') {
    const top = topScorerLine(m.box_score);
    if (top) lines.push(top);
    lines.push(top ? `Box score Skor+'ta: ${url}` : `Skor ve istatistik Skor+'ta: ${url}`);
  } else {
    const top = topRatingLine(m.player_ratings);
    if (top) lines.push(top);
    lines.push(top ? `Kadro ve puanlar Skor+'ta: ${url}` : `Maç özeti Skor+'ta: ${url}`);
  }
  return lines.join('\n');
}

/** İndirme adresi Google Play mağaza sayfası mı (Play build'i; EAS `production` ortamı) */
export const isPlayStoreUrl = (url: string): boolean => /^https:\/\/play\.google\.com\//i.test(url.trim());

/**
 * Davetiye metni: bağlantı indirme adresidir (`/m/` yok), `?ref=invite&k=<kod>`.
 * Play adresiyse "Google Play'den indir" (pazarlama Sürüm 3 tek CTA); değilse nötr "İndir" (yan yükleme
 * anlatımı yok — Döngü 7 bulgu 12). Mağaza referrer'ı (`&referrer=`) P1'de `storeUrl` ile gelir.
 */
export function buildInviteText(downloadUrl: string, code: string): string {
  const cta = isPlayStoreUrl(downloadUrl) ? "Google Play'den indir" : 'İndir';
  return `Türkçe, reklamsız skor uygulaması Skor+. ${cta}: ${withRef(downloadUrl, 'invite', code)} — Uygulamayı açınca davet kodum: ${code}`;
}

/**
 * Kod girme sonucu → ekrandaki satır. `tone`: ok = `live`, error = `danger`, info = `textMuted`.
 * `closeInput`: giriş satırı gizlenir (ok / too_late / already).
 */
export function redeemMessage(r: RedeemResult): {
  result: RedeemResult;
  text: string;
  ok: boolean;
  tone: 'ok' | 'error' | 'info';
  closeInput: boolean;
} {
  return { result: r, ...redeemText(r) };
}

function redeemText(r: RedeemResult): { text: string; ok: boolean; tone: 'ok' | 'error' | 'info'; closeInput: boolean } {
  switch (r) {
    case 'ok':
      return { text: 'Teşekkürler, davet kaydedildi.', ok: true, tone: 'ok', closeInput: true };
    case 'invalid':
      return { text: 'Kod bulunamadı.', ok: false, tone: 'error', closeInput: false };
    case 'self':
      return { text: 'Kendi kodunu giremezsin.', ok: false, tone: 'error', closeInput: false };
    case 'too_late':
      return { text: 'Davet kodu yalnız ilk 7 günde girilebilir.', ok: false, tone: 'info', closeInput: true };
    case 'already':
      return { text: 'Bu hesapta zaten bir davet kodu kayıtlı.', ok: false, tone: 'info', closeInput: true };
    case 'not_allowed':
      return { text: 'Bu kod bu hesapta kullanılamaz.', ok: false, tone: 'error', closeInput: false };
    case 'rate_limited':
      return { text: 'Çok fazla deneme yapıldı. Yarın tekrar dene.', ok: false, tone: 'error', closeInput: false };
    default:
      return { text: 'Kod kaydedilemedi. Tekrar dene.', ok: false, tone: 'error', closeInput: false };
  }
}

/**
 * Pazarlama "Yasaklı iddialar ve ifadeler" (küçük harf, tr); Deno testi ve e2e (`e2e/share_ui.mjs`) aynı
 * listeyi kullanır. Eşleşme `findBannedShareTerms`: baş sınırı + terim + isteğe bağlı Türkçe ad çekim eki
 * ("oranı", "tahmini", "canlıda", "kesinlikle", "bahisçi" yakalanır; "kazandı", "Oranje", "Kazanspor" yakalanmaz).
 * Kelime olarak yakalanamayanlar (uydurma sayı / puan, kapsam dışı ligler) elle denetlenir.
 * "Play Store'da" pazarlama Sürüm 3 ile serbest (Play dağıtımı; tek CTA "Google Play'den indir").
 */
export const BANNED_SHARE_TERMS: readonly string[] = [
  // tazelik
  'canlı',
  'anlık',
  'gerçek zamanlı',
  'en hızlı',
  'dakika dakika',
  'birazdan',
  'anında',
  'maç biter bitmez',
  // bugün kapalı bildirimler
  'gol bildirimi',
  'baskı alarmı',
  'kırmızı kart alarmı',
  // bahis / kesinlik
  'tahmin',
  'kesin',
  'garanti',
  'kazan',
  'kazandırır',
  'kupon',
  'oran',
  'iddaa',
  'bahis',
  // resmîlik / ortaklık
  'resmî',
  'resmi',
  'onaylı',
  // kanıtsız üstünlük
  "türkiye'nin ilk",
  "türkiye'nin tek",
  'en iyi',
  '1 numara',
  // Pro satışta değil
  'abone ol',
  'fiyat',
  'ödül',
  'ücretsiz pro',
  'her maçta ai ücretsiz',
  'ay sonunda',
  // paylaşım / dağıtım
  'maçın oyuncusu',
  '%100',
  'virüssüz',
];

const TR_LETTER = 'a-zçğıöşüâîû0-9';
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Terimden sonra gelebilecek Türkçe ad çekim / yapım ekleri (art arda, ör. kesin+lik+le). Döngü 8 bulgu 9:
 * ünsüz yumuşaması "-lığ/-liğ/-luğ/-lüğ" + iyelik ("canlılığı", "kesinliği"). Fiil ekleri
 * bilerek yok: "kazandı" (geçmiş zaman) yasaklı "kazan" sayılmaz. Ek dışı devam ("Oranje", "Kazanspor",
 * "Kesinoglu", "İyilerspor") eşleşmez.
 */
const SUFFIX =
  '(?:lar|ler|lığ|liğ|luğ|lüğ|lık|lik|luk|lük|ca|ce|ça|çe|çı|çi|çu|çü|cı|ci|cu|cü|sı|si|su|sü|nı|ni|nu|nü|yı|yi|yu|yü|' +
  'nın|nin|nun|nün|ın|in|un|ün|da|de|ta|te|dan|den|tan|ten|ya|ye|la|le|lı|li|lu|lü|dır|dir|dur|dür|tır|tir|tur|tür|ı|i|u|ü|a|e)*';

/**
 * Yanlış pozitif izin listesi: gerçek kulüp / ad (Döngü 7 bulgu 10). Kontrolden önce metinden çıkarılır.
 * Kapsam genişledikçe eklenir; maç paylaşımında ayrıca `ignore` ile o maçın takım adları çıkarılabilir.
 */
export const BANNED_TERM_ALLOW: readonly string[] = ['mc oran', 'asm oran', 'rubin kazan', 'resmiye'];

/**
 * Döngü 8 bulgu 9: bir terimin ek almış ama kökü değişmiş biçimleri. `stems`: ad eki alan ek kökler (ünlü
 * düşmesi "bahis" → "bahsi", "bahse"; "resmen"). `prefixes`: fiil kökleri, her türlü devamla eşleşir
 * ("kazandırıyor", "resmîleşti"). Eşleşme ana terim adıyla raporlanır. "bahsetti" (söz etti) "bahs" + fiil eki
 * olduğundan yakalanmaz.
 */
const TERM_FORMS: Readonly<Record<string, { stems?: readonly string[]; prefixes?: readonly string[] }>> = {
  bahis: { stems: ['bahs'] },
  resmi: { stems: ['resmen'], prefixes: ['resmileş'] },
  'resmî': { prefixes: ['resmîleş'] },
  kazandırır: { prefixes: ['kazandır'] },
};

const APOSTROPHES = /['’‘ʼ`´]/g;
const SPACES = /[\s  ]+/g;
const LETTER_DASH = /(\p{L})[-‐‑–](?=\p{L})/gu;

/**
 * Normalize + iki küçük harf yolu. Kesme işaretleri silinir ("Türkiye’nin" = "Türkiyenin"), harf arası tire ve
 * tüm boşluklar (NBSP dahil) tek boşluk olur. Türkçe küçültme ("KESİN" → "kesin", ama ASCII "KESIN" → "kesın")
 * ve kök küçültme ("KESIN" → "kesin"; "İ" → "i" + birleşik nokta silinir); herhangi biri eşleşirse yakalanır.
 */
function lowerVariants(text: string): string[] {
  const base = String(text ?? '').replace(APOSTROPHES, '').replace(SPACES, ' ').replace(LETTER_DASH, '$1 ');
  const tr = base.toLocaleLowerCase('tr');
  const root = base.toLowerCase().replace(/̇/g, '');
  return tr === root ? [tr] : [tr, root];
}

/**
 * Metindeki yasaklı ifadeler; boş dizi = temiz. `ignore`: kontrol dışı tutulacak özel adlar (ör. maçın takım
 * adları — "MC Oran", "Rubin Kazan" gibi kulüpler yasaklı kök içerir).
 */
export function findBannedShareTerms(text: string, ignore: readonly string[] = []): string[] {
  // ASCII büyük yazılmış ad ("RUBIN KAZAN") Türkçe küçültmede "rubın" olur: noktasız biçim de çıkarılır
  const drop = [...BANNED_TERM_ALLOW, ...ignore.flatMap(lowerVariants)]
    .flatMap((n) => [n, n.replace(/i/g, 'ı')])
    .filter((n) => n.trim().length > 0);
  const variants = lowerVariants(text).map((v) => drop.reduce((acc, n) => acc.split(n).join(' '), v));
  const head = `(^|[^${TR_LETTER}])`;
  return BANNED_SHARE_TERMS.filter((term) => {
    const forms = TERM_FORMS[term];
    const stems = [term, ...(forms?.stems ?? [])].map((t) => lowerVariants(t)[0]);
    const res = [
      ...stems.map((k) => new RegExp(`${head}${escapeRe(k)}${SUFFIX}([^${TR_LETTER}]|$)`)),
      ...(forms?.prefixes ?? []).map((k) => new RegExp(`${head}${escapeRe(lowerVariants(k)[0])}`)),
    ];
    return variants.some((v) => res.some((re) => re.test(v)));
  });
}
