import type {
  AnalysisRequestResult,
  AnyTacticalPayload,
  AskResult,
  ChatMessage,
  HalftimePayload,
  HalftimeRequestResult,
  Match,
  MatchAlert,
  FollowedTeam,
  NotificationPrefs,
  PreviewPayload,
  RedCardAnalysis,
  PreviewRequestResult,
  Sport,
  SubscriptionPlan,
} from '../types';

/**
 * UI'nin konuştuğu tek arayüz. İstemci ASLA harici spor API'sine gitmez;
 * gerçek uygulamada tüm çağrılar Supabase'e (tablo, Realtime, RPC) gider.
 */
export interface DataSource {
  listMatches(sport: Sport): Promise<Match[]>;
  getMatch(fixtureId: number): Promise<Match | null>;
  /** matches tablosundaki (seçili spor) INSERT/UPDATE değişikliklerini dinler. Aboneliği iptal eden fonksiyonu döndürür. */
  subscribeMatches(sport: Sport, onChange: (m: Match) => void): () => void;
  subscribeMatch(fixtureId: number, onChange: (m: Match) => void): () => void;
  requestAnalysis(fixtureId: number): Promise<AnalysisRequestResult>;
  getAnalysis(fixtureId: number): Promise<AnyTacticalPayload | null>;
  /** Maç öncesi AI: request_match_preview RPC (singleflight) */
  requestPreview(fixtureId: number): Promise<PreviewRequestResult>;
  getPreview(fixtureId: number): Promise<PreviewPayload | null>;
  /** Canlı devre arası "Soyunma Odası Reçetesi": request_halftime_report RPC */
  requestHalftime(fixtureId: number): Promise<HalftimeRequestResult>;
  getHalftime(fixtureId: number): Promise<HalftimePayload | null>;
  /** Maç takibi: devre arası bildirimi yalnız takip edenlere gider. Dönüş: yeni durum */
  toggleFollow(fixtureId: number): Promise<boolean>;
  listFollowedIds(): Promise<number[]>;
  registerPushToken(token: string, platform: string): Promise<void>;
  /** Takım takibi: takımın başlamamış maçları da otomatik takibe alınır. Dönüş: yeni durum */
  toggleTeamFollow(t: FollowedTeam): Promise<boolean>;
  listFollowedTeams(): Promise<FollowedTeam[]>;
  /** Akıllı alarm: maçın alarm geçmişi (yeniden eskiye) ve canlı akış */
  listAlerts(fixtureId: number): Promise<MatchAlert[]>;
  subscribeAlerts(fixtureId: number, onAlert: (a: MatchAlert) => void): () => void;
  /** Kırmızı kart canlı taktik analizi (yalnız Pro, RLS) */
  getAlertAnalysis(alertId: number): Promise<RedCardAnalysis | null>;
  getNotificationPrefs(): Promise<NotificationPrefs>;
  setNotificationPrefs(p: NotificationPrefs): Promise<void>;
  /** Taktik Asistana Sor: kullanıcının bu maçtaki soruları, soru gönderme, canlı yanıt */
  listChat(fixtureId: number): Promise<ChatMessage[]>;
  askAssistant(fixtureId: number, question: string): Promise<AskResult>;
  subscribeChat(fixtureId: number, onMessage: (m: ChatMessage) => void): () => void;
  getPremium(): Promise<boolean>;
  /** YALNIZCA TEST: gerçek ödeme entegrasyonu (RevenueCat / IAP) gelene kadar */
  simulateSubscription(plan: SubscriptionPlan | null): Promise<boolean>;
}
