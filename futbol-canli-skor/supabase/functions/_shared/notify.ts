import { sendExpoPush } from './push.ts';
import { admin } from './supabaseAdmin.ts';
import { chunk } from './syncUtils.ts';

/** notification_prefs kolonları (bkz. 0007_alerts.sql). Satırı olmayan kullanıcıda hepsi açık. */
export type NotifyKind = 'halftime' | 'pressure' | 'nba_run' | 'red_card' | 'kickoff';

/**
 * `in.(…)` listesi GET URL'ine yazılır (uid başına ~37 karakter). Kalabalık maçta URL sınırı
 * aşılmasın diye uid / token listeleri bu boyutta parçalanır.
 */
const IN_CHUNK = 100;
/** PostgREST satır sınırı (varsayılan max-rows 1000): takipçiler bu boyutta sayfalanır */
const PAGE = 1000;
/** Güvenlik sınırı: sonsuz döngü olmasın (200 sayfa = 200 bin takipçi) */
const MAX_PAGES = 200;

/** Tablo/kolon henüz kurulmamış (migration eksik): tercih yok sayılır, herkes açık */
const isMissingTable = (e: { code?: string } | null) =>
  !!e && ['42P01', 'PGRST205', '42703', 'PGRST204'].includes(e.code ?? '');

/** Maçın tüm takipçileri, .range() ile sayfalı (ilk 1000 satırda kesilmez) */
async function followerIds(fixtureId: number): Promise<string[] | null> {
  const ids = new Set<string>();
  for (let page = 0; page < MAX_PAGES; page++) {
    const from = page * PAGE;
    const { data, error } = await admin
      .from('match_follows')
      .select('user_id')
      .eq('fixture_id', fixtureId)
      .order('user_id')
      .range(from, from + PAGE - 1);
    if (error) {
      console.error(`[notify] ${fixtureId} takipçiler okunamadı (sayfa ${page + 1}):`, error.message);
      return page === 0 ? null : [...ids]; // okunan sayfalara yine gönderilsin
    }
    for (const r of data ?? []) ids.add(r.user_id as string);
    if ((data?.length ?? 0) < PAGE) {
      if (page > 0) console.log(`[notify] ${fixtureId}: ${ids.size} takipçi, ${page + 1} sayfa`);
      return [...ids];
    }
  }
  console.warn(`[notify] ${fixtureId}: takipçi sayfa sınırına (${MAX_PAGES * PAGE}) ulaşıldı; kalanlar atlandı`);
  return [...ids];
}

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
  const followers = await followerIds(fixtureId);
  if (!followers?.length) return 0;
  let userIds = followers;

  // Türü kapatanları çıkar (tablo henüz kurulmadıysa herkes açık sayılır).
  // Başka bir hatada parça bir kez yeniden okunur; yine okunamazsa o parçanın kullanıcılarına
  // bu bildirim gönderilmez (şüphede gönderme; Döngü 4, bulgu 11). Diğer parçalar etkilenmez.
  const blocked = new Set<string>();
  const readOff = (part: string[]) => admin.from('notification_prefs').select('user_id').in('user_id', part).eq(kind, false);
  for (const part of chunk(userIds, IN_CHUNK)) {
    let { data: off, error: prefErr } = await readOff(part);
    if (prefErr && !isMissingTable(prefErr)) ({ data: off, error: prefErr } = await readOff(part));
    if (prefErr) {
      if (isMissingTable(prefErr)) {
        console.warn('[notify] notification_prefs tablosu yok, tümü açık sayıldı:', prefErr.message);
        break;
      }
      console.warn(`[notify] ${fixtureId}: notification_prefs parçası okunamadı, ${part.length} kullanıcı atlandı:`, prefErr.message);
      for (const u of part) blocked.add(u);
      continue;
    }
    for (const r of off ?? []) blocked.add(r.user_id as string);
  }
  userIds = userIds.filter((u) => !blocked.has(u));
  if (!userIds.length) return 0;

  const tokens: string[] = [];
  for (const part of chunk(userIds, IN_CHUNK)) {
    const { data: rows, error: tokErr } = await admin.from('push_tokens').select('token').in('user_id', part);
    if (tokErr) {
      console.error(`[notify] ${fixtureId} push token'ları okunamadı:`, tokErr.message);
      continue; // diğer parçalar yine gönderilsin
    }
    for (const t of rows ?? []) tokens.push(t.token as string);
  }
  if (!tokens.length) return 0;
  const { sent, invalidTokens } = await sendExpoPush(
    tokens.map((to) => ({ to, title, body, data: { fixture_id: fixtureId, kind, ...data } })),
  );
  for (const part of chunk(invalidTokens, IN_CHUNK)) {
    const { error } = await admin.from('push_tokens').delete().in('token', part);
    if (error) console.warn('[notify] geçersiz token silinemedi:', error.message);
  }
  return sent;
}
