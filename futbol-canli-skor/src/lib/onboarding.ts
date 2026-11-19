import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORE_MODE } from './storeMode';
import { PREVIEW_MODE } from './supabase';

/**
 * F5 ilk açılış takım seçimi (docs/inovasyon-onerileri.md F5). Yerel bayrak: ekran bir kez gösterilir
 * (gösterildiği an yazılır; "Atla", geri tuşu ve uygulamayı kapatmak da "görüldü" sayılır).
 * Migration / sunucu değişikliği yok.
 */
const KEY = 'skor.onboarding.seen';
// growth.ts aktif gün anahtarı: OTA ile gelen mevcut kullanıcı (dünden önce açmış) seçimi görmez
const ACTIVITY_KEY = 'skor.activity.lastDay';
// Türkiye sabit UTC+3 (bkz. growth.ts, days.ts)
const istanbulToday = () => new Date(Date.now() + 3 * 3600_000).toISOString().slice(0, 10);

export async function shouldShowOnboarding(): Promise<boolean> {
  if (STORE_MODE) return false;
  // Önizleme (web e2e): yalnız ?onboarding=1 ile; diğer e2e testleri her açılışta temiz tarayıcıyla başlar
  if (PREVIEW_MODE && !/[?&]onboarding=1(?:&|$)/.test(globalThis.location?.search ?? '')) return false;
  try {
    if ((await AsyncStorage.getItem(KEY)) != null) return false;
    const lastDay = await AsyncStorage.getItem(ACTIVITY_KEY);
    if (lastDay && lastDay !== istanbulToday()) {
      await markOnboardingSeen(); // eski kurulum: sorma
      return false;
    }
    return true;
  } catch {
    return false; // depolama okunamıyorsa kullanıcıyı ekranla bekletme
  }
}

export async function markOnboardingSeen(): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, '1');
  } catch {
    /* bir sonraki açılışta yeniden gösterilebilir; akış durmaz */
  }
}
