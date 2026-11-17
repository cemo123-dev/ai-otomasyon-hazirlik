import { sendExpoPush } from './push.ts';
import { admin } from './supabaseAdmin.ts';

/** notification_prefs kolonları (bkz. 0007_alerts.sql). Satırı olmayan kullanıcıda hepsi açık. */
export type NotifyKind = 'halftime' | 'pressure' | 'nba_run' | 'red_card' | 'kickoff';

/**
 * Maçı takip eden ve bu bildirim türünü kapatmamış kullanıcılara push gönderir.
 * Geçersiz (DeviceNotRegistered) token'lar silinir. Dönüş: başarıyla gönderilen sayısı.
 */
export async function notifyFollowers(
  fixtureId: number,
  kind: NotifyKind,
  title: string,
  body: string,
  data: Record<string, unknown> = {},
): Promise<number> {
  const { data: follows } = await admin.from('match_follows').select('user_id').eq('fixture_id', fixtureId);
  let userIds = [...new Set((follows ?? []).map((r) => r.user_id as string))];
  if (!userIds.length) return 0;

  // Türü kapatanları çıkar (tablo henüz kurulmadıysa herkes açık sayılır)
  const { data: off, error: prefErr } = await admin.from('notification_prefs').select('user_id').in('user_id', userIds).eq(kind, false);
  if (prefErr) console.warn('[notify] notification_prefs okunamadı, tümü açık sayıldı:', prefErr.message);
  else if (off?.length) {
    const blocked = new Set(off.map((r) => r.user_id as string));
    userIds = userIds.filter((u) => !blocked.has(u));
  }
  if (!userIds.length) return 0;

  const { data: tokens } = await admin.from('push_tokens').select('token').in('user_id', userIds);
  if (!tokens?.length) return 0;
  const { sent, invalidTokens } = await sendExpoPush(
    tokens.map((t) => ({ to: t.token as string, title, body, data: { fixture_id: fixtureId, kind, ...data } })),
  );
  if (invalidTokens.length) await admin.from('push_tokens').delete().in('token', invalidTokens);
  return sent;
}
