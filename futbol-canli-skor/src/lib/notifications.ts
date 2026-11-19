import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { dataSource } from './data';
import { STORE_MODE } from './storeMode';

/**
 * Push bildirim kaydı (devre arası raporu için).
 * Kaynak: https://docs.expo.dev/push-notifications/push-notifications-setup.md
 *
 * Kısıtlar:
 *  - Android'de uzak bildirim Expo Go'da ÇALIŞMAZ (SDK 53+): development build gerekir.
 *  - Expo push token'ı için EAS projectId gerekir (eas init / ilk development build).
 */
export type PushRegistration = { ok: true } | { ok: false; reason: string };

let registered: Promise<PushRegistration> | null = null;

// Uygulama ön plandayken gelen bildirimi de göster
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

async function register(): Promise<PushRegistration> {
  // Mağaza görseli çekimi (?store=1, yalnız önizleme): web'e özgü not karede görünmesin
  if (Platform.OS === 'web') return STORE_MODE ? { ok: true } : { ok: false, reason: 'Web sürümünde bildirim desteklenmiyor.' };
  if (!Device.isDevice) return { ok: false, reason: 'Bildirimler yalnız gerçek cihazda çalışır.' };

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Maç bildirimleri',
      // eslint-disable-next-line import/namespace -- yanlış alarm: enum, tsc ile doğrulanıyor
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  const current = await Notifications.getPermissionsAsync();
  const status = current.status === 'granted' ? current.status : (await Notifications.requestPermissionsAsync()).status;
  if (status !== 'granted') return { ok: false, reason: 'Bildirim izni verilmedi.' };

  const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
  if (!projectId) return { ok: false, reason: 'Bildirimler için uygulamanın EAS sürümü gerekiyor (projectId yok).' };

  try {
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    await dataSource.registerPushToken(token, Platform.OS);
    return { ok: true };
  } catch (e) {
    const msg = (e as { message?: string } | null)?.message ?? 'bilinmeyen hata';
    // Expo Go (Android) bu noktada hata verir: development build gerekir
    return { ok: false, reason: `Bildirim kaydı yapılamadı: ${msg}` };
  }
}

/** Oturum başına bir kez dener; sonucu önbelleğe alır */
export function ensurePushRegistration(): Promise<PushRegistration> {
  if (!registered) registered = register();
  return registered;
}

/** Bildirim yanıtından maç kimliği (yoksa null) */
function fixtureIdOf(resp: Notifications.NotificationResponse): number | null {
  const id = Number(resp.notification.request.content.data?.fixture_id);
  return Number.isFinite(id) && id > 0 ? id : null;
}

/**
 * Bildirime dokununca ilgili maç açılır (bkz. app/_layout.tsx). Yalnız native'de çağrılır
 * (web'de getLastNotificationResponse desteklenmez ve hata fırlatır).
 * useLastNotificationResponse hem soğuk açılıştaki (uygulamayı bildirim başlattı) hem de açıkken
 * gelen dokunuşu verir; işlenen yanıt temizlenir ki ekran yeniden açılınca tekrar yönlendirmesin.
 * Kaynak: https://docs.expo.dev/versions/v58.0.0/sdk/notifications/
 */
export function useNotificationOpen(handler: (fixtureId: number) => void): void {
  const resp = Notifications.useLastNotificationResponse();
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);
  useEffect(() => {
    if (!resp || resp.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
    const id = fixtureIdOf(resp);
    try {
      Notifications.clearLastNotificationResponse();
    } catch {
      // eski native modülde yoksa: yanıt yine yalnız bir kez işlenir (hook aynı kimliği tekrar vermez)
    }
    if (id != null) handlerRef.current(id);
  }, [resp]);
}
