// NBA metinlerinde futbol terimi bekçisi (0 token).
// LLM bazen basketbol maçını futbol diliyle anlatıyor (gol, forvet, teknik direktör, rövanş…).
// Bu terimleri içeren NBA metni/cümlesi atılır; yerine deterministik basketbol cümlesi kullanılır.

/** Büyük/küçük harf duyarsız futbol terimleri (Türkçe ekleriyle) */
const FOOTBALL_WORDS =
  /(?<!\p{L})(gol\p{L}*|kaleci\p{L}*|kale(si|ye|de|den|sini)?|forvet\p{L}*|santrfor\p{L}*|penaltı\p{L}*|ofsayt\p{L}*|korner\p{L}*|(sarı|kırmızı) kart\p{L}*|orta saha\p{L}*|stoper\p{L}*|kanat bek\p{L}*|teknik direktör\p{L}*|devre arası\p{L}*|rövanş\p{L}*|ilk 11|son düdük\p{L}*)(?!\p{L})/iu;

/** Büyük harfe duyarlı kısaltmalar ("var" Türkçede yaygın kelime olduğu için yalnız "VAR") */
const FOOTBALL_ABBR = /(?<!\p{L})(VAR|xG|xGA)(?!\p{L})/u;

/** Futbol terimine benzeyen NBA özel adları ("Golden State" → gol…) testten önce çıkarılır */
const NBA_NAMES = /golden state/giu;

export function hasFootballTerm(text: string | null | undefined): boolean {
  if (!text) return false;
  const t = text.replace(NBA_NAMES, '');
  return FOOTBALL_WORDS.test(t) || FOOTBALL_ABBR.test(t);
}

/** Metinde futbol terimi varsa yedeğe düşer */
export const basketballOr = (text: string | null | undefined, fallback: string): string =>
  text?.trim() && !hasFootballTerm(text) ? text : fallback;

/** Futbol terimi geçen cümleleri atar (sohbet yanıtları için) */
export function dropFootballSentences(text: string): string {
  return text
    .split(/(?<=[.!?])\s+(?=[A-ZÇĞİÖŞÜ"'])/)
    .filter((s) => !hasFootballTerm(s))
    .join(' ')
    .trim();
}
