/**
 * API plan bayrakları — spor başına AYRI (Döngü 7 / inovasyon §0.7, P0).
 *
 * API-Football Pro plana geçer (7.500/gün), API-NBA ücretsiz kalır (100/gün). Eskiden NBA kodu da
 * API_FOOTBALL_PAID okuyordu: futbol bayrağı açılınca NBA kota bekçisi (`createQuotaGuard({ paid: true })`)
 * her isteğe izin verir ve NBA'in 100 isteği box score geri doldurmasıyla saatler içinde biterdi.
 *
 * Kural: Edge Function'larda plan bayrağını YALNIZ bu dosya okur. NBA kodu NBA_PAID, futbol kodu
 * FOOTBALL_PAID kullanır. tests/paidFlags.test.ts bu kuralı kaynak taramasıyla korur.
 *   API_FOOTBALL_PAID=1 → futbol ücretli yolları (toplu ids=, canlı detay, akıllı alarm, −1…+7 fikstür)
 *   API_NBA_PAID=1      → NBA ücretli yolları (bekleme yok, seri alarmı). Varsayılan KAPALI.
 */
export const PAID_ENV = { football: 'API_FOOTBALL_PAID', nba: 'API_NBA_PAID' } as const;

export type Sport = keyof typeof PAID_ENV;
export type PaidFlags = Record<Sport, boolean>;

/** Saf: env okuyucudan iki bağımsız bayrak (yalnız tam '1' açık sayılır) */
export function readPaidFlags(get: (name: string) => string | undefined): PaidFlags {
  return {
    football: get(PAID_ENV.football) === '1',
    nba: get(PAID_ENV.nba) === '1',
  };
}

/** Saf: spora göre bayrak (ortak kodda, ör. "maç başladı" bildirim metni) */
export const paidFor = (sport: Sport, flags: PaidFlags): boolean => flags[sport];

// env izni yoksa (yalnız --allow-read ile çalışan testler) iki bayrak da kapalı sayılır
const FLAGS = readPaidFlags((name) => {
  try {
    return Deno.env.get(name);
  } catch {
    return undefined;
  }
});
export const FOOTBALL_PAID = FLAGS.football;
export const NBA_PAID = FLAGS.nba;
export const PAID_FLAGS: Readonly<PaidFlags> = Object.freeze({ ...FLAGS });
