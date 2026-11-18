/**
 * Senkron ve bildirimler için saf yardımcılar (ortam değişkeni / ağ yok → Deno testleriyle doğrulanır).
 */

/** ISO zaman damgasının verilen saat dilimindeki günü (YYYY-MM-DD) */
export function localDate(iso: string, tz: string): string {
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: tz });
}

/**
 * Maçların başlama günleri (tekrarsız, sıralı). Listeden düşen maçlar gün başına TEK
 * /fixtures?date= isteğiyle güncellenir (maç başına 1 istek yerine).
 */
export function uniqueLocalDates(isos: (string | null | undefined)[], tz: string): string[] {
  const out = new Set<string>();
  for (const iso of isos) {
    if (!iso || Number.isNaN(Date.parse(iso))) continue;
    out.add(localDate(iso, tz));
  }
  return [...out].sort();
}

/**
 * API-Football /status yanıtından günlük kalan istek (limit_day - current). Okunamazsa null.
 * response bazen nesne, hata durumunda boş dizi gelir.
 */
// deno-lint-ignore no-explicit-any
export function remainingFromStatus(body: any): number | null {
  const r = Array.isArray(body?.response) ? body.response[0] : body?.response;
  const cur = Number(r?.requests?.current);
  const lim = Number(r?.requests?.limit_day);
  if (!Number.isFinite(cur) || !Number.isFinite(lim) || lim <= 0) return null;
  return Math.max(0, lim - cur);
}

/** Diziyi en fazla `size` elemanlık parçalara böler (URL sınırı için `in.(…)` sorguları) */
export function chunk<T>(arr: readonly T[], size: number): T[][] {
  if (!Number.isInteger(size) || size < 1) throw new Error('chunk: size >= 1 olmalı');
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/**
 * "Maç başladı" bildirim metni. Yalnız gerçekten çalışan özellikler vaat edilir:
 *  - Akıllı alarmlar (baskı, kırmızı kart, NBA seri) yalnız ücretli planda üretilir.
 *  - Devre arası raporu yalnız futbolda ve ücretli planda (dakikalık senkron) güvenilir; NBA'de yok.
 */
export function kickoffBody(opts: {
  sport: 'football' | 'nba';
  paid: boolean;
  home: string;
  away: string;
  minute: number | null;
}): string {
  const late = opts.sport === 'football' && (opts.minute ?? 0) > 5 ? ` (${opts.minute}')` : '';
  const base = `${opts.home} - ${opts.away} başladı${late}.`;
  if (opts.sport === 'nba') return opts.paid ? `${base} Seri alarmı takipte.` : base;
  // Ücretsiz planda devre arası 30 dk'lık senkronla ancak bazen yakalanır: vaat edilmez
  return opts.paid ? `${base} Devre arası raporu ve akıllı alarmlar takipte.` : base;
}

// ─────────────────────────────────────────────── Pro API (0018, inovasyon §0.7)

/** Ücretli planda fikstür en fazla bu kadar gün ileri çekilir (istemci gün şeridi −1…+7) */
export const MAX_FIXTURE_DAYS_AHEAD = 7;

/**
 * Fikstür senkronunun gün kaydırmaları (Europe/Istanbul günü, bugün = 0).
 * Ücretsiz plan: yalnız −1, 0, +1 (API dar tarih penceresi verir; FIXTURE_DAYS_AHEAD yok sayılır →
 * istek sayısı eskisiyle birebir). Ücretli: −1…+FIXTURE_DAYS_AHEAD (varsayılan 7, 1…7 arası).
 */
export function fixtureDayOffsets(paid: boolean, aheadRaw?: string): number[] {
  let ahead = 1;
  if (paid) {
    const n = aheadRaw == null || aheadRaw.trim() === '' ? MAX_FIXTURE_DAYS_AHEAD : Number(aheadRaw);
    ahead = Number.isFinite(n) ? Math.min(MAX_FIXTURE_DAYS_AHEAD, Math.max(1, Math.floor(n))) : MAX_FIXTURE_DAYS_AHEAD;
  }
  const out: number[] = [];
  for (let d = -1; d <= ahead; d++) out.push(d);
  return out;
}

/**
 * "Maç başladı" bildiriminin gönderileceği en geç dakika. Ücretsiz planda senkron 30 dk'da bir
 * olduğundan ilk 35 dk'da yakalanan maç bildirilir; ücretli planda (dakikalık) yalnız ilk 5 dk.
 * `minutely`: bu çağrı GERÇEKTEN dakikalık takvimden mi geliyor (bkz. `isMinutelyCadence`).
 */
export const kickoffWindowMinutes = (minutely: boolean): number => (minutely ? 5 : 35);

/**
 * Döngü 8 bulgu 6: pencere secret'a göre değil, isteğin temposuna göre seçilir. Dakikalık senkron yalnız
 * secret açık (paid) VE cron gövdesi `cadence: 'paid'` iken vardır. Secret açık + DB ücretsiz (gövdede cadence
 * yok, cron 30 dk) ya da DB ücretli + secret kapalı (ücretsiz dilimlere inilir) → 30 dk'lık akış → 35 dk.
 */
export const isMinutelyCadence = (paid: boolean, cadence: unknown): boolean => paid && cadence === 'paid';

/**
 * Ücretsiz plan takvimi (0004_quota.sql, UTC): canlı `*\/30 12-22 * * *`, fikstür `0 9 * * *`.
 * 0018: app_config.api_paid false iken cron takvimi 0004'le aynıdır (dakikalık iş YOK). Bu fonksiyon
 * Edge tarafındaki İKİNCİ emniyettir: DB "ücretli" deyip
 * (cadence = 'paid') API_FOOTBALL_PAID secret'ı henüz açılmadıysa yalnız bu dakikalar işlenir.
 */
export function isFreePlanSlot(mode: 'live' | 'schedule', at: Date): boolean {
  const h = at.getUTCHours();
  const m = at.getUTCMinutes();
  if (mode === 'schedule') return h === 9 && m === 0;
  return h >= 12 && h <= 22 && (m === 0 || m === 30);
}

/**
 * Cron gövdesinden çalıştırma kararı (saf). `slot` isteğe bağlı (gövdede dakika verilirse pg_net
 * gecikmesinden bağımsız karar; 0018 göndermez → Edge saati). Ücretsiz takvimin cron gövdesi
 * ({"mode":"live"}) cadence taşımaz → her zaman çalışır (0004 ile aynı davranış).
 * Döngü 8 bulgu 3: fikstür (`schedule`) her zaman çalışır. DB ücretli + secret kapalıyken ücretli takvimin
 * 03:00 / 15:00 çağrıları ücretsiz yolla (secret kapalı → −1…+1 gün = 3 istek) işlenir: günde 2 × 3 = 6 istek,
 * 100/gün içinde. Eskiden yalnız 09:00 kabul edildiği için bu durumda fikstür hiç gelmiyordu.
 * Yalnız dakikalık canlı çağrılar ücretsiz dilimlere (:00/:30, 12–22 UTC) indirilir.
 */
export function shouldRunSync(opts: {
  mode: 'live' | 'schedule';
  paid: boolean;
  cadence?: unknown;
  slot?: unknown;
  now: Date;
}): boolean {
  if (opts.paid || opts.cadence !== 'paid' || opts.mode === 'schedule') return true;
  const at = typeof opts.slot === 'string' && !Number.isNaN(Date.parse(opts.slot)) ? new Date(opts.slot) : opts.now;
  return isFreePlanSlot(opts.mode, at);
}
