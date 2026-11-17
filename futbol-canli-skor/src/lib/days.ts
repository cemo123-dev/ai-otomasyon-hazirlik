// Ana ekran tarih şeridi: Dün / Bugün / Yarın — gün ayrımı Europe/Istanbul saatine göre.
// Türkiye 2016'dan beri sabit UTC+3 (yaz saati yok); Intl saat dilimi desteğine bağımlı kalmamak için sabit fark.
const ISTANBUL_OFFSET_MS = 3 * 3600_000;
const DAY_MS = 86400_000;

/** API-Football ücretsiz planı yalnız ±1 gün tarih penceresine izin verir; veri sync-matches/sync-nba ile bu üç gün için gelir */
export type DayOffset = -1 | 0 | 1;
export const DAY_OFFSETS: DayOffset[] = [-1, 0, 1];

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

/** Şerit etiketi: { title: 'Bugün', sub: '17 Kas' } */
export function dayLabel(offset: DayOffset, now = Date.now()): { title: string; sub: string } {
  const [, m, d] = dayKeyFromToday(offset, now).split('-').map(Number);
  return { title: offset === -1 ? 'Dün' : offset === 0 ? 'Bugün' : 'Yarın', sub: `${d} ${MONTHS[m - 1]}` };
}

/** "Son güncelleme HH:MM" için saat (cihaz saatiyle, maç saatleriyle aynı biçim) */
export const clockTime = (iso: string) => new Date(iso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
