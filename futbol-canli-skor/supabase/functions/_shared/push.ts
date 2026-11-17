/**
 * Expo Push API ile bildirim gönderimi.
 * Kaynak: https://docs.expo.dev/push-notifications/sending-notifications.md
 * Not: Android'de uzak bildirim Expo Go'da çalışmaz (SDK 53+); development build gerekir.
 */
const ENDPOINT = 'https://exp.host/--/api/v2/push/send';
const CHUNK = 100; // Expo tek istekte en fazla 100 mesaj kabul eder

export type PushMessage = { to: string; title: string; body: string; data?: Record<string, unknown> };

/** Gönderir; "DeviceNotRegistered" dönen (silinmesi gereken) token'ları döndürür */
export async function sendExpoPush(messages: PushMessage[]): Promise<{ sent: number; invalidTokens: string[] }> {
  const invalidTokens: string[] = [];
  let sent = 0;
  for (let i = 0; i < messages.length; i += CHUNK) {
    const batch = messages.slice(i, i + CHUNK).map((m) => ({ ...m, sound: 'default', channelId: 'default', priority: 'high' }));
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Accept-encoding': 'gzip, deflate', 'Content-Type': 'application/json' },
      body: JSON.stringify(batch),
    });
    if (!res.ok) {
      console.warn('[push] gönderim hatası:', res.status, (await res.text()).slice(0, 300));
      continue;
    }
    const body = await res.json();
    (body.data ?? []).forEach((ticket: { status: string; details?: { error?: string } }, j: number) => {
      if (ticket.status === 'ok') sent++;
      else if (ticket.details?.error === 'DeviceNotRegistered') invalidTokens.push(batch[j].to);
    });
  }
  return { sent, invalidTokens };
}
