/**
 * Akıllı alarm — veritabanı adımları (sync-matches / sync-nba ortak).
 * Ek API isteği yoktur: ücretli planda canlı maç detayı zaten her dakika çekilir.
 * 0007_alerts.sql kurulmadıysa senkronu bozmaz, yalnız uyarı loglar.
 */
import {
  detectNbaRun,
  detectPressure,
  footballSnapshot,
  nbaRunAlert,
  PRESSURE,
  pressureAlert,
  redCardAlerts,
  type AlertDraft,
  type Snapshot,
} from './alerts.ts';
import { admin } from './supabaseAdmin.ts';
import type { MatchRow } from './types.ts';

const HISTORY_MIN = 20; // pencere hesabı için geriye bakılan süre
const KEEP_HOURS = 6; // eski görüntüler silinir

async function history(fixtureIds: number[]): Promise<Map<number, Snapshot[]>> {
  const since = new Date(Date.now() - HISTORY_MIN * 60_000).toISOString();
  const { data, error } = await admin
    .from('match_snapshots')
    .select('fixture_id, taken_at, minute, home_score, away_score, data')
    .in('fixture_id', fixtureIds)
    .gte('taken_at', since);
  if (error) throw error;
  const out = new Map<number, Snapshot[]>();
  for (const s of (data ?? []) as Snapshot[]) out.set(s.fixture_id, [...(out.get(s.fixture_id) ?? []), s]);
  return out;
}

/** Alarmları ekler; aynı dedupe_key ikinci kez eklenmez (tetikleyici yalnız yeni satırda çalışır) */
async function insertAlerts(alerts: AlertDraft[]): Promise<number> {
  if (!alerts.length) return 0;
  const { data, error } = await admin
    .from('match_alerts')
    .upsert(alerts, { onConflict: 'dedupe_key', ignoreDuplicates: true })
    .select('id');
  if (error) throw error;
  return data?.length ?? 0;
}

/** Aynı takım için son PRESSURE.cooldownMin dakikada baskı alarmı gittiyse tekrar gönderilmez */
async function inCooldown(fixtureId: number, side: string): Promise<boolean> {
  const since = new Date(Date.now() - PRESSURE.cooldownMin * 60_000).toISOString();
  const { count } = await admin
    .from('match_alerts')
    .select('id', { count: 'exact', head: true })
    .eq('fixture_id', fixtureId)
    .eq('kind', 'pressure')
    .eq('side', side)
    .gte('created_at', since);
  return (count ?? 0) > 0;
}

async function prune() {
  const before = new Date(Date.now() - KEEP_HOURS * 3600_000).toISOString();
  await admin.from('match_snapshots').delete().lt('taken_at', before);
}

/** Futbol: canlı maç satırları (detaylı) → görüntü kaydı + baskı / kırmızı kart alarmları */
export async function runFootballAlerts(rows: Partial<MatchRow>[], liveStatuses: string[]): Promise<number> {
  try {
    const live = rows.filter((r) => r.fixture_id && liveStatuses.includes(r.status_short ?? '') && r.status_short !== 'HT');
    if (!live.length) return 0;
    const hist = await history(live.map((r) => r.fixture_id!));
    const snaps = live.map((r) => footballSnapshot(r.fixture_id!, r.elapsed_minute ?? null, r.home_score ?? null, r.away_score ?? null, r.stats ?? null));
    const { error } = await admin.from('match_snapshots').insert(snaps);
    if (error) throw error;

    const alerts: AlertDraft[] = [];
    for (let i = 0; i < live.length; i++) {
      const r = live[i];
      const names = { home: r.home_team ?? 'Ev sahibi', away: r.away_team ?? 'Deplasman' };
      for (const hit of detectPressure(snaps[i], hist.get(r.fixture_id!) ?? [])) {
        if (!(await inCooldown(r.fixture_id!, hit.side))) alerts.push(pressureAlert(r.fixture_id!, r.elapsed_minute!, hit, names[hit.side]));
      }
      alerts.push(...redCardAlerts(r.fixture_id!, r.elapsed_minute ?? null, r.events ?? null, names));
    }
    const n = await insertAlerts(alerts);
    await prune();
    return n;
  } catch (e) {
    console.warn('[alerts] futbol alarmları atlandı:', e instanceof Error ? e.message : e);
    return 0;
  }
}

/** NBA: canlı maç satırları → skor görüntüsü + seri alarmı */
export async function runNbaAlerts(rows: { fixture_id: number; status_short: string; elapsed_minute: number | null; home_score: number | null; away_score: number | null; home_team: string; away_team: string }[]): Promise<number> {
  try {
    const live = rows.filter((r) => r.status_short === 'LIVE' && r.home_score != null);
    if (!live.length) return 0;
    const hist = await history(live.map((r) => r.fixture_id));
    const snaps: Snapshot[] = live.map((r) => ({
      fixture_id: r.fixture_id,
      taken_at: new Date().toISOString(),
      minute: r.elapsed_minute,
      home_score: r.home_score,
      away_score: r.away_score,
      data: null,
    }));
    const { error } = await admin.from('match_snapshots').insert(snaps);
    if (error) throw error;

    const alerts: AlertDraft[] = [];
    for (let i = 0; i < live.length; i++) {
      const r = live[i];
      const run = detectNbaRun([...(hist.get(r.fixture_id) ?? []), snaps[i]]);
      if (run) alerts.push(nbaRunAlert(r.fixture_id, run, run.side === 'home' ? r.home_team : r.away_team));
    }
    const n = await insertAlerts(alerts);
    await prune();
    return n;
  } catch (e) {
    console.warn('[alerts] NBA alarmları atlandı:', e instanceof Error ? e.message : e);
    return 0;
  }
}
