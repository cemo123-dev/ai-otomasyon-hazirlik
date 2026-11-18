/**
 * Maç durum kodları (API-Football / API-NBA status.short) — saf modül, Deno testleriyle doğrulanır
 * (supabase/functions/tests/status.test.ts). Canlı listesi sunucudaki _shared/types.ts LIVE ile aynı olmalı.
 */
export const LIVE_STATUSES = ['1H', 'HT', '2H', 'ET', 'BT', 'P', 'LIVE', 'INT', 'SUSP'] as const;
export const FINISHED_STATUSES = ['FT', 'AET', 'PEN'] as const;

export const isLive = (s: string) => (LIVE_STATUSES as readonly string[]).includes(s);
export const isFinished = (s: string) => (FINISHED_STATUSES as readonly string[]).includes(s);

/** Oynanmayacak / sonucu sahada belli olmayacak maçlar: ne canlı ne bitmiş, başlama saati de anlamsız */
const OFF: Record<string, { short: string; long: string }> = {
  PST: { short: 'Ert.', long: 'Ertelendi' },
  CANC: { short: 'İptal', long: 'İptal edildi' },
  ABD: { short: 'Yarıda', long: 'Yarıda kaldı' },
  AWD: { short: 'Hükmen', long: 'Hükmen sonuç' },
  WO: { short: 'Hükmen', long: 'Hükmen (rakip çıkmadı)' },
};

export const isOff = (s: string) => s in OFF;

/** Ertelenen / iptal / yarıda kalan / hükmen maç etiketi; diğer durumlarda null */
export function offLabel(s: string, variant: 'short' | 'long' = 'long'): string | null {
  return OFF[s]?.[variant] ?? null;
}

/** Canlı rozetindeki kısa metin (liste sütunu dar): devre arası, askı ve ara dakika yerine yazılır */
export function liveLabel(status: string, minute: number | null): string {
  if (status === 'HT') return 'İY';
  if (status === 'SUSP') return 'Askı';
  if (status === 'INT') return 'Ara';
  return `${minute ?? 0}'`;
}

/**
 * Ekran okuyucu için durum özeti: "58. dakika", "devre arası", "maç askıya alındı" …
 * NBA'de elapsed_minute çeyrek numarasıdır: "3. çeyrek", 5+ → "uzatma".
 */
export function statusSpeech(status: string, minute: number | null, sport: 'football' | 'nba' = 'football'): string {
  if (status === 'HT') return 'devre arası';
  if (status === 'SUSP') return 'maç askıya alındı';
  if (status === 'INT') return 'maç durduruldu';
  if (isLive(status) && sport === 'nba') return minute != null ? (minute > 4 ? 'uzatma' : `${minute}. çeyrek`) : 'canlı';
  if (isLive(status)) return minute != null ? `${minute}. dakika` : 'canlı';
  if (isFinished(status)) return 'maç sonu';
  return offLabel(status)?.toLocaleLowerCase('tr') ?? '';
}

/** Saati belli olmayan maç (TBD): başlama saati yerine yazılır */
export const isTimeTbd = (s: string) => s === 'TBD';
