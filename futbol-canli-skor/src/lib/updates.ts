import { requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';

/**
 * Açılışta OTA güncellemesini kontrol eder (EAS Update; kanal build'den gelir: Play build'i `production`,
 * eski yan yüklenmiş APK `preview` — her OTA iki kanala da yayınlanır, bkz. package.json update:prod / update:apk).
 * Varsayılan davranışta güncelleme arka planda iner ve ancak bir SONRAKİ açılışta devreye
 * girer; kullanıcının iki kez kapatıp açması gerekmesin diye güncelleme hızlı inerse
 * uygulama hemen yeniden yüklenir.
 *
 * Kullanıcı habersiz sıfırlanmasın: yeniden yükleme YALNIZ güncelleme açılıştan sonraki kısa
 * pencerede (RELOAD_WINDOW_MS) indiyse ve kullanıcı henüz ana ekrandan ayrılmadıysa (maç açmadı,
 * bildirimden gelmedi; asistan girişi de maç ekranında) yapılır. Aksi halde indirilen güncelleme bir sonraki
 * açılışta kendiliğinden devreye girer.
 *
 * Çalışmadığı durumlar (sessizce atlanır):
 *  - Geliştirme modu (__DEV__) ve web
 *  - expo-updates native modülü olmayan eski build'ler (ör. önceki development build):
 *    modül import'u hata fırlatır, bu yüzden önce hata fırlatmayan kontrol yapılır
 *  - Ağ yoksa / güncelleme sunucusuna ulaşılamazsa (mevcut kodla devam edilir)
 */
const RELOAD_WINDOW_MS = 3000;
const launchedAt = Date.now();
let started = false;
let navigated = false;

/** Kullanıcı ana ekrandan ayrıldı (bkz. app/_layout.tsx): artık yeniden yükleme yapılmaz */
export function markUserNavigated(): void {
  navigated = true;
}

/** Saf karar (test edilebilir): indirilen güncelleme şimdi mi uygulanmalı? */
export function shouldReloadNow(fetchedAt: number, launched: number, userNavigated: boolean): boolean {
  return !userNavigated && fetchedAt - launched <= RELOAD_WINDOW_MS;
}

export async function applyUpdateOnLaunch(): Promise<void> {
  if (started || __DEV__ || Platform.OS === 'web') return;
  started = true;
  if (!requireOptionalNativeModule('ExpoUpdates')) return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- native modül olmayabilir
    const Updates = require('expo-updates') as typeof import('expo-updates');
    if (!Updates.isEnabled) return;
    const check = await Updates.checkForUpdateAsync();
    if (!check.isAvailable) return;
    const fetched = await Updates.fetchUpdateAsync();
    if (!fetched.isNew) return;
    if (shouldReloadNow(Date.now(), launchedAt, navigated)) await Updates.reloadAsync();
    else console.log('[updates] güncelleme indi; kullanıcı işlem yaptığı için sonraki açılışta uygulanacak');
  } catch (e) {
    console.warn('[updates] güncelleme uygulanamadı, mevcut sürümle devam:', (e as { message?: string } | null)?.message);
  }
}
