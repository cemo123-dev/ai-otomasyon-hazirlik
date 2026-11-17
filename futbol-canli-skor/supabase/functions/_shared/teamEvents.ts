/**
 * Takım takibi ve "maç başladı" bildirimi (bkz. 0010_teams.sql).
 * 0010 kurulmadıysa senkronu bozmaz, yalnız uyarı loglar. Ek API isteği yoktur.
 */
import { notifyFollowers } from './notify.ts';
import { admin } from './supabaseAdmin.ts';

/** Yeni/güncel fikstürleri takımı takip eden kullanıcıların maç takibine ekler */
export async function followTeamFixtures(fixtureIds: number[]): Promise<number> {
  if (!fixtureIds.length) return 0;
  const { data, error } = await admin.rpc('follow_team_fixtures', { p_fixture_ids: fixtureIds });
  if (error) {
    console.warn('[team] follow_team_fixtures:', error.message);
    return 0;
  }
  return (data as number) ?? 0;
}

type LiveRow = { fixture_id: number; home_team: string; away_team: string; elapsed_minute: number | null };

/**
 * Yeni başlayan maçlar için tek seferlik bildirim (kickoff_notified kilidi).
 * Senkron aralığı yüzünden geç yakalanan maçlarda dakika da yazılır; çok ilerlemiş
 * maçlar (maxMinute üstü) için bildirim gönderilmez.
 */
export async function notifyKickoffs(rows: LiveRow[], sport: 'football' | 'nba', maxMinute: number): Promise<number> {
  const fresh = rows.filter((r) => (r.elapsed_minute ?? 0) <= maxMinute);
  if (!fresh.length) return 0;
  // Atomik sahiplenme: aynı maç için ikinci bildirim gitmez
  const { data, error } = await admin
    .from('matches')
    .update({ kickoff_notified: true })
    .in('fixture_id', fresh.map((r) => r.fixture_id))
    .eq('kickoff_notified', false)
    .select('fixture_id');
  if (error) {
    console.warn('[team] kickoff_notified:', error.message);
    return 0;
  }
  let sent = 0;
  for (const { fixture_id } of data ?? []) {
    const r = fresh.find((x) => x.fixture_id === fixture_id)!;
    const late = sport === 'football' && (r.elapsed_minute ?? 0) > 5 ? ` (${r.elapsed_minute}')` : '';
    sent += await notifyFollowers(
      fixture_id,
      'kickoff',
      sport === 'nba' ? '🏀 Maç başladı' : '⚽ Maç başladı',
      `${r.home_team} - ${r.away_team} başladı${late}. Devre arası raporu ve akıllı alarmlar takipte.`,
    );
  }
  return sent;
}
