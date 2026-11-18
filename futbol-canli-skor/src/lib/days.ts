// Ana ekran tarih şeridi: Dün / Bugün / Yarın (+ ücretli futbol planında 7 güne kadar ileri) —
// gün ayrımı Europe/Istanbul saatine göre.
// Türkiye 2016'dan beri sabit UTC+3 (yaz saati yok); Intl saat dilimi desteğine bağımlı kalmamak için sabit fark.
const ISTANBUL_OFFSET_MS = 3 * 3600_000;
const DAY_MS = 86400_000;

/**
 * Ücretsiz API planı yalnız ±1 gün tarih penceresine izin verir; veri sync-matches/sync-nba ile bu üç gün
 * için gelir. Ücretli futbol planında (0018, FIXTURE_DAYS_AHEAD) fikstür −1…+7 gün çekilir.
 */
export type DayOffset = -1 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
/** Ücretsiz plan (ve NBA, ücretsiz kalır): Dün / Bugün / Yarın */
export const DAY_OFFSETS: DayOffset[] = [-1, 0, 1];
/** Ücretli planda şeridin son günü (sunucu: syncUtils.MAX_FIXTURE_DAYS_AHEAD) */
export const PAID_MAX_DAY_OFFSET = 7;
const PAID_DAY_OFFSETS: DayOffset[] = [-1, 0, 1, 2, 3, 4, 5, 6, 7];

/**
 * Şeritte gösterilecek günler: ücretli plan doğrulanmışsa −1…+ahead, değilse (ya da bilinmiyorsa) −1…+1.
 * `ahead`: sunucunun fikstür gün sayısı (0019 app_config.fixture_days_ahead; Döngü 8 bulgu 8) — 1…7'ye
 * kırpılır; bilinmiyorsa 7 (sunucu varsayılanı).
 */
export const dayOffsetsFor = (paid: boolean | null | undefined, ahead?: number | null): DayOffset[] => {
  if (paid !== true) return DAY_OFFSETS;
  const n = typeof ahead === 'number' && Number.isFinite(ahead) ? Math.min(PAID_MAX_DAY_OFFSET, Math.max(1, Math.floor(ahead))) : PAID_MAX_DAY_OFFSET;
  return PAID_DAY_OFFSETS.filter((d) => d <= n);
};

/** İstanbul gününün anahtarı: "YYYY-MM-DD" */
export const istanbulDayKey = (iso: string | number | Date): string =>
  new Date(new Date(iso).getTime() + ISTANBUL_OFFSET_MS).toISOString().slice(0, 10);

/** Bugüne göre kaydırılmış İstanbul gününün anahtarı */
export const dayKeyFromToday = (offset: number, now = Date.now()): string => istanbulDayKey(now + offset * DAY_MS);

/** İstanbul gününün başlangıcı (UTC epoch ms) */
export const istanbulDayStartMs = (offset: number, now = Date.now()): number => {
  const shifted = now + ISTANBUL_OFFSET_MS;
  return shifted - (shifted % DAY_MS) - ISTANBUL_OFFSET_MS + offset * DAY_MS;
};

const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
const WEEKDAYS = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

/** Şerit etiketi: { title: 'Bugün', sub: '17 Kas' }; 2+ gün için kısa gün adı: { title: 'Cmt', sub: '22 Kas' } */
export function dayLabel(offset: DayOffset, now = Date.now()): { title: string; sub: string } {
  const key = dayKeyFromToday(offset, now);
  const [y, m, d] = key.split('-').map(Number);
  const title =
    offset === -1 ? 'Dün' : offset === 0 ? 'Bugün' : offset === 1 ? 'Yarın' : WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return { title, sub: `${d} ${MONTHS[m - 1]}` };
}

/** "Son güncelleme HH:MM" için saat (cihaz saatiyle, maç saatleriyle aynı biçim) */
export const clockTime = (iso: string) => new Date(iso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
