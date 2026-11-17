import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { dataSource } from './data';

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
  if (Platform.OS === 'web') return { ok: false, reason: 'Web sürümünde bildirim desteklenmiyor.' };
  if (!Device.isDevice) return { ok: false, reason: 'Bildirimler yalnız gerçek cihazda çalışır.' };

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Maç bildirimleri',
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

/** Bildirime dokununca ilgili maç açılır (bkz. app/_layout.tsx) */
export function onNotificationOpen(handler: (fixtureId: number) => void): () => void {
  if (Platform.OS === 'web') return () => {};
  const sub = Notifications.addNotificationResponseReceivedListener((resp) => {
    const id = Number(resp.notification.request.content.data?.fixture_id);
    if (Number.isFinite(id)) handler(id);
  });
  return () => sub.remove();
}
