// NBA metinlerinde futbol terimi bekçisi (0 token).
// LLM bazen basketbol maçını futbol diliyle anlatıyor (gol, forvet, teknik direktör, rövanş…).
// Bu terimleri içeren NBA metni/cümlesi atılır; yerine deterministik basketbol cümlesi kullanılır.

/**
 * Futbol terimleri (Türkçe ekleriyle). Metin önce toLocaleLowerCase('tr') ile küçültülür:
 * JS'nin /i bayrağı Türkçe İ↔i ve I↔ı eşleşmesini yapmıyor ("İLK 11", "PENALTI").
 * - gol: yalnız gerçek ekler (Golf, Golan, "golden" eşleşmez; "golden" bilinçli olarak dışarıda)
 * - korner üçlük: basketbolda "korner üçlüğü" (corner three) futbol terimi değil
 * - çok kelimeli terimlerde \s+ (çift boşluk / satır sonu)
 */
const FOOTBALL_WORDS =
  /(?<!\p{L})(gol(ü\p{L}*|e|de|l[eü]\p{L}*|cü\p{L}*|süz\p{L}*)?|kaleci\p{L}*|kale(si|ye|de|den|sini)?|forvet\p{L}*|santrfor\p{L}*|penaltı\p{L}*|ofsayt\p{L}*|korner(?!\s+üçl)\p{L}*|(sarı|kırmızı)\s+kart\p{L}*|orta\s+saha\p{L}*|stoper\p{L}*|kanat\s+bek\p{L}*|teknik\s+direktör\p{L}*|devre\s+arası\p{L}*|rövanş\p{L}*|ilk\s+11|son\s+düdük\p{L}*)(?!\p{L})/u;

/** Büyük harfe duyarlı kısaltmalar ("var" Türkçede yaygın kelime olduğu için yalnız "VAR"); orijinal metinle test edilir */
const FOOTBALL_ABBR = /(?<!\p{L})(VAR|xG|xGA)(?!\p{L})/u;

/** Futbol terimine benzeyen NBA özel adları ("Golden State" → gol…) testten önce çıkarılır */
const NBA_NAMES = /golden\s+state/gu;

export function hasFootballTerm(text: string | null | undefined): boolean {
  if (!text) return false;
  const t = text.toLocaleLowerCase('tr').replace(NBA_NAMES, '');
  return FOOTBALL_WORDS.test(t) || FOOTBALL_ABBR.test(text);
}

/** Metinde futbol terimi varsa yedeğe düşer */
export const basketballOr = (text: string | null | undefined, fallback: string): string =>
  text?.trim() && !hasFootballTerm(text) ? text : fallback;
