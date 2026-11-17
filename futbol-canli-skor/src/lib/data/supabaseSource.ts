import type { SupabaseClient } from '@supabase/supabase-js';
import { ensureSession } from '../supabase';
import type {
  AnalysisRequestResult,
  AnyTacticalPayload,
  HalftimePayload,
  HalftimeRequestResult,
  Match,
  MatchAlert,
  NotificationPrefs,
  PreviewPayload,
  PreviewRequestResult,
  RedCardAnalysis,
} from '../types';
import { DEFAULT_PREFS } from '../types';
import type { DataSource } from './types';

// preview_status/lineups 0005_prematch.sql, halftime_* 0006_halftime.sql ile gelir
const MATCH_COLUMNS =
  'fixture_id, sport_type, league_name, league_country, league_priority, kickoff_at, home_team, away_team, ' +
  'home_score, away_score, status_short, elapsed_minute, status_detail, period_scores, summary_teaser, ' +
  'analysis_status, events, stats, preview_status, lineups, halftime_status, halftime_teaser';

let channelSeq = 0;

export function createSupabaseSource(sb: SupabaseClient): DataSource {
  const listen = (filter: string | undefined, onChange: (m: Match) => void) => {
    const channel = sb
      .channel(`matches:${filter ?? 'all'}:${++channelSeq}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches', ...(filter ? { filter } : {}) },
        (payload) => {
          if (payload.eventType === 'DELETE') return;
          onChange(payload.new as Match);
        },
      )
      .subscribe();
    return () => {
      sb.removeChannel(channel);
    };
  };

  return {
    async listMatches(sport) {
      // Bugün ± 1 gün penceresi: canlı + biten + başlayacak
      const from = new Date(Date.now() - 36 * 3600_000).toISOString();
      const to = new Date(Date.now() + 36 * 3600_000).toISOString();
      const { data, error } = await sb
        .from('matches')
        .select(MATCH_COLUMNS)
        .eq('sport_type', sport)
        .gte('kickoff_at', from)
        .lte('kickoff_at', to)
        .order('league_priority')
        .order('kickoff_at');
      if (error) throw error;
      return (data ?? []) as unknown as Match[];
    },

    async getMatch(fixtureId) {
      const { data, error } = await sb
        .from('matches')
        .select(MATCH_COLUMNS)
        .eq('fixture_id', fixtureId)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as Match | null;
    },

    // Realtime filtre: yalnızca seçili sporun satırları gelir
    subscribeMatches: (sport, onChange) => listen(`sport_type=eq.${sport}`, onChange),
    subscribeMatch: (fixtureId, onChange) => listen(`fixture_id=eq.${fixtureId}`, onChange),

    async requestAnalysis(fixtureId) {
      // Oturum yoksa RPC "permission denied" verir; bunun yerine anlaşılır bir durum döndür
      if (!(await ensureSession())) return 'unauthenticated';
      const { data, error } = await sb.rpc('request_match_analysis', { p_fixture_id: fixtureId });
      if (error) throw error;
      return data as AnalysisRequestResult;
    },

    async getAnalysis(fixtureId) {
      // RLS: yalnızca aktif abonelikli kullanıcılar okuyabilir
      const { data, error } = await sb
        .from('match_analyses')
        .select('tactical_payload')
        .eq('fixture_id', fixtureId)
        .maybeSingle();
      if (error) throw error;
      return (data?.tactical_payload as AnyTacticalPayload | undefined) ?? null;
    },

    async requestPreview(fixtureId) {
      if (!(await ensureSession())) return 'unauthenticated';
      const { data, error } = await sb.rpc('request_match_preview', { p_fixture_id: fixtureId });
      if (error) throw error;
      return data as PreviewRequestResult;
    },

    async getPreview(fixtureId) {
      // RLS: yalnızca aktif abonelikli kullanıcılar okuyabilir
      const { data, error } = await sb
        .from('match_previews')
        .select('preview_payload')
        .eq('fixture_id', fixtureId)
        .maybeSingle();
      if (error) throw error;
      return (data?.preview_payload as PreviewPayload | undefined) ?? null;
    },

    async requestHalftime(fixtureId) {
      if (!(await ensureSession())) return 'unauthenticated';
      const { data, error } = await sb.rpc('request_halftime_report', { p_fixture_id: fixtureId });
      if (error) throw error;
      return data as HalftimeRequestResult;
    },

    async getHalftime(fixtureId) {
      // RLS: yalnızca aktif abonelikli kullanıcılar okuyabilir
      const { data, error } = await sb
        .from('match_halftime_reports')
        .select('report_payload')
        .eq('fixture_id', fixtureId)
        .maybeSingle();
      if (error) throw error;
      return (data?.report_payload as HalftimePayload | undefined) ?? null;
    },

    async toggleFollow(fixtureId) {
      await ensureSession();
      const { data, error } = await sb.rpc('toggle_follow', { p_fixture_id: fixtureId });
      if (error) throw error;
      return data === true;
    },

    async listFollowedIds() {
      if (!(await ensureSession())) return [];
      const { data, error } = await sb.from('match_follows').select('fixture_id');
      if (error) throw error;
      return (data ?? []).map((r) => r.fixture_id as number);
    },

    async registerPushToken(token, platform) {
      await ensureSession();
      const { error } = await sb.rpc('register_push_token', { p_token: token, p_platform: platform });
      if (error) throw error;
    },

    async listAlerts(fixtureId) {
      const { data, error } = await sb
        .from('match_alerts')
        .select('id, fixture_id, kind, side, minute, title, body, analysis_status, created_at')
        .eq('fixture_id', fixtureId)
        .order('created_at', { ascending: false })
        .limit(30);
      if (error) throw error;
      return (data ?? []) as MatchAlert[];
    },

    // Yeni alarm (INSERT) ve analiz durumu değişimi (UPDATE) canlı gelir
    subscribeAlerts(fixtureId, onAlert) {
      const channel = sb
        .channel(`alerts:${fixtureId}:${++channelSeq}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'match_alerts', filter: `fixture_id=eq.${fixtureId}` },
          (payload) => {
            if (payload.eventType !== 'DELETE') onAlert(payload.new as MatchAlert);
          },
        )
        .subscribe();
      return () => {
        sb.removeChannel(channel);
      };
    },

    async getAlertAnalysis(alertId) {
      // RLS: yalnızca aktif abonelikli kullanıcılar okuyabilir
      const { data, error } = await sb.from('match_alert_analyses').select('payload').eq('alert_id', alertId).maybeSingle();
      if (error) throw error;
      return (data?.payload as RedCardAnalysis | undefined) ?? null;
    },

    async getNotificationPrefs() {
      if (!(await ensureSession())) return DEFAULT_PREFS;
      const { data, error } = await sb.from('notification_prefs').select('halftime, pressure, nba_run, red_card').maybeSingle();
      if (error) throw error;
      return (data as NotificationPrefs | null) ?? DEFAULT_PREFS;
    },

    async setNotificationPrefs(p) {
      await ensureSession();
      const { error } = await sb.rpc('set_notification_prefs', {
        p_halftime: p.halftime,
        p_pressure: p.pressure,
        p_nba_run: p.nba_run,
        p_red_card: p.red_card,
      });
      if (error) throw error;
    },

    async getPremium() {
      const uid = await ensureSession();
      if (!uid) return false;
      const { data } = await sb.rpc('is_premium_user');
      return data === true;
    },

    async simulateSubscription(plan) {
      await ensureSession();
      const { data, error } = await sb.rpc('simulate_subscription', { p_plan: plan });
      if (error) throw error;
      return data === true;
    },
  };
}
