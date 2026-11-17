import { requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';

/**
 * Açılışta OTA güncellemesini kontrol edip hemen uygular (EAS Update, kanal: preview).
 * Varsayılan davranışta güncelleme arka planda iner ve ancak bir SONRAKİ açılışta devreye
 * girer; APK kullanıcılarının iki kez kapatıp açması gerekmesin diye burada indirilip
 * uygulama yeniden yüklenir.
 *
 * Çalışmadığı durumlar (sessizce atlanır):
 *  - Geliştirme modu (__DEV__) ve web
 *  - expo-updates native modülü olmayan eski build'ler (ör. önceki development build):
 *    modül import'u hata fırlatır, bu yüzden önce hata fırlatmayan kontrol yapılır
 *  - Ağ yoksa / güncelleme sunucusuna ulaşılamazsa (mevcut kodla devam edilir)
 */
let started = false;

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
    if (fetched.isNew) await Updates.reloadAsync();
  } catch (e) {
    console.warn('[updates] güncelleme uygulanamadı, mevcut sürümle devam:', (e as { message?: string } | null)?.message);
  }
}
