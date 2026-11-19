/**
 * Kullanıcıya gösterilecek Türkçe hata metni. Ham İngilizce hata (PostgrestError, "Failed to fetch",
 * "Network request failed") ekrana yazılmaz; ayrıntı yalnız konsola düşer.
 */
import { noteAppError } from './appSignals';

const NETWORK = /failed to fetch|network request failed|networkerror|load failed|timeout|timed out|fetch failed|aborted/i;

export const NETWORK_MESSAGE = 'Bağlantı kurulamadı. İnternetini kontrol edip tekrar dene.';

export function friendlyError(e: unknown, fallback: string): string {
  const msg = (e as { message?: string } | null)?.message ?? '';
  if (msg) console.warn('[hata]', msg);
  noteAppError(); // değerlendirme isteği hatadan hemen sonra sorulmaz (reviewPolicy.ts)
  return NETWORK.test(msg) ? NETWORK_MESSAGE : fallback;
}
