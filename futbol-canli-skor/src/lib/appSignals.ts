/**
 * Oturum içi sinyaller (bellekte; içe aktarma yok). Değerlendirme isteği kuralı (`reviewPolicy.ts`) okur:
 * kullanıcıya hata gösterildikten hemen sonra ve canlı maç ekranı açıkken değerlendirme istenmez.
 */
let lastErrorAt: number | null = null;
let liveScreens = 0;

/** `friendlyError` her kullanıcıya dönük hata metninde çağırır */
export function noteAppError(nowMs = Date.now()): void {
  lastErrorAt = nowMs;
}
export const getLastAppErrorAt = (): number | null => lastErrorAt;

/** Canlı maç ekranı açıldı / kapandı (sayaç: iç içe ekranlar) */
export function enterLiveScreen(): () => void {
  liveScreens++;
  let done = false;
  return () => {
    if (done) return;
    done = true;
    liveScreens = Math.max(0, liveScreens - 1);
  };
}
export const isOnLiveScreen = (): boolean => liveScreens > 0;
