/**
 * KOTA BEKÇİSİ (saf mantık, Deno testli: tests/quota.test.ts).
 *
 * API-Sports kotaları ürün başına AYRIDIR: API-Football (futbol) ve API-NBA her biri kendi
 * 100 istek/gün kotasına sahiptir (prod logu 2026-11-17: aynı 30 dk'da futbol 63 → 59, NBA 49 → 30).
 * Bu yüzden her ürün kendi bekçisini kullanır ve diğer ürün için rezerv BIRAKMAZ.
 * (0004_quota.sql başlığındaki "ortak kota" yorumu eskidir; uygulanmış migration'a dokunulmadı.)
 *
 * Kota UTC gece yarısı sıfırlanır. Değer, öğrenildiği an ile saklanır:
 * - önceki UTC gününe aitse geçersizdir (bilinmiyor sayılır → bekçi izin verir, ilk yanıt başlığı tazeler);
 * - QUOTA_TTL_MS'den eskiyse `stale()` true döner ve /status ile yeniden sorulmalıdır
 *   (aynı gün içinde başka örnekler de kota harcar; eski değer kalanı fazla gösterir).
 */
export const QUOTA_TTL_MS = 10 * 60_000;

/**
 * Varsayılan rezervler (env ile ezilebilir). Her biri YALNIZ kendi ürününün günlük sabit işleri içindir:
 * - Futbol isteğe bağlı detay: günün kalan sabit işleri (skor-sync-schedule ~3, skor-sync-cleanup ~2) + 1 pay.
 * - Futbol durum düzeltmesi (canlı → MS, tarih başına 1 istek): kota neredeyse bitene kadar yapılır.
 * - NBA isteğe bağlı kutu skoru: NBA'in kendi sabit işleri için küçük pay.
 * - NBA box score geri doldurması: NBA_QUOTA_RESERVE'e ek pay (eskiden "futbol için" 20'ydi).
 *
 * Pro API (0018, inovasyon §0.7): futbol 7.500/gün olunca API_FOOTBALL_PAID=1 → futbol bekçisi `paid: true`
 * kurulur. Döngü 8 bulgu 7: ücretli planda da isteğe bağlı çekimler yalnız kalan > rezerv iken yapılır
 * (`allows` iki planda aynı kuralı uygular) → ücretli yolda FOOTBALL_QUOTA_RESERVE_PAID (varsayılan 500) fren olur;
 * bir hata/döngü 7.500'ü bitirmeden durur (Döngü 9: rezerv plana göre seçilir, bkz. footballOptionalReserve). Ücretsiz plan davranışı değişmedi. NBA ücretsiz kalır: bekçisi
 * API_NBA_PAID'e bağlıdır (varsayılan kapalı, bkz. paidFlags.ts) ve futbol bayrağından ETKİLENMEZ.
 */
export const DEFAULT_RESERVES = {
  footballOptional: 6,
  /** Döngü 9 bulgu 1: ücretli plan rezervi ayrı env'dedir (FOOTBALL_QUOTA_RESERVE_PAID) */
  footballOptionalPaid: 500,
  footballStatusFloor: 3,
  nbaOptional: 5,
  nbaBoxBackfill: 6,
} as const;

/** Ücretsiz plan günlük futbol kotası 100: bundan büyük bir ücretsiz rezerv isteğe bağlı çekimleri kalıcı durdurur */
export const FREE_FOOTBALL_RESERVE_MAX = 50;

/**
 * Plana göre futbol isteğe bağlı çekim rezervi (Döngü 9 bulgu 1).
 * - Ücretli: FOOTBALL_QUOTA_RESERVE_PAID (varsayılan 500). FOOTBALL_QUOTA_RESERVE ücretli planda OKUNMAZ.
 * - Ücretsiz: FOOTBALL_QUOTA_RESERVE (varsayılan 6), en fazla FREE_FOOTBALL_RESERVE_MAX. Geri dönüşte
 *   unutulmuş eski bir `FOOTBALL_QUOTA_RESERVE=500` secret'ı ücretsiz planı kilitleyemez.
 */
export function footballOptionalReserve(
  paid: boolean,
  freeRaw: string | undefined,
  paidRaw: string | undefined,
): number {
  if (paid) return envNumber(paidRaw, DEFAULT_RESERVES.footballOptionalPaid);
  return Math.min(envNumber(freeRaw, DEFAULT_RESERVES.footballOptional), FREE_FOOTBALL_RESERVE_MAX);
}

const DAY_MS = 86_400_000;
/** UTC gün numarası (kota bu sınırda sıfırlanır) */
export const utcDay = (ms: number) => Math.floor(ms / DAY_MS);

export type QuotaGuard = {
  /** Bugün (UTC) bilinen kalan istek; hiç öğrenilmediyse ya da önceki güne aitse null */
  remaining(now?: number): number | null;
  /** Yanıt başlığından ya da /status'tan öğrenilen kalan istek */
  set(remaining: number, now?: number): void;
  /** /status ile yeniden sorulmalı mı: bilinmiyor, önceki UTC günü ya da TTL aşıldı */
  stale(now?: number): boolean;
  /** `needed` istekten sonra en az `reserve` istek kalacak mı (bilinmiyorsa izin verir) */
  allows(reserve: number, needed?: number, now?: number): boolean;
};

export function createQuotaGuard(opts: { paid: boolean; ttlMs?: number }): QuotaGuard {
  const ttl = opts.ttlMs ?? QUOTA_TTL_MS;
  let value: number | null = null;
  let at = 0;
  const remaining = (now = Date.now()) => (value === null || utcDay(at) !== utcDay(now) ? null : value);
  return {
    remaining,
    set(rem, now = Date.now()) {
      if (!Number.isFinite(rem)) return;
      value = Math.max(0, rem);
      at = now;
    },
    stale(now = Date.now()) {
      return remaining(now) === null || now - at > ttl;
    },
    allows(reserve, needed = 1, now = Date.now()) {
      // Plan fark etmez (Döngü 8): ücretli planda rezerv büyüktür (FOOTBALL_QUOTA_RESERVE_PAID, varsayılan 500)
      const rem = remaining(now);
      return rem === null || rem - needed >= reserve;
    },
  };
}

/**
 * `x-ratelimit-requests-remaining` başlığı → sayı. Başlık yoksa, boşsa ya da sayı değilse null
 * (`Number('') = 0` tüm isteğe bağlı çekimleri durdururdu).
 * Çağıran, değeri isteğin GÖNDERİLDİĞİ anla damgalamalıdır (`quota.set(rem, sentAt)`): gece yarısını
 * geçen geç yanıttaki dünkü kalan "dün" sayılır ve yeni günün kotasını kilitlemez.
 */
export function remainingFromHeader(raw: string | null | undefined): number | null {
  const s = raw?.trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** Env değişkeninden sayısal ayar; boş/geçersizse varsayılan */
export function envNumber(raw: string | undefined, fallback: number): number {
  if (raw == null || raw.trim() === '') return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}
