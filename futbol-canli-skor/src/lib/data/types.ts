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
import type { RedeemResult } from '../share';

export type { RedeemResult };
/**
 * F3: Ayarlar davet kartının tek isteği (get_my_invite). `active` yalnız `total >= 3` iken dolu (KVKK, Döngü 6
 * bulgu 5): tek davetlinin kullanım günleri sayaçtan çıkarılamasın. null → kart "Aktif olan"ı göstermez.
 */
export type InviteState = { code: string; total: number; active: number | null; invited: boolean; canRedeem: boolean };

/**
 * UI'nin konuştuğu tek arayüz. İstemci ASLA harici spor API'sine gitmez;
 * gerçek uygulamada tüm çağrılar Supabase'e (tablo, Realtime, RPC) gider.
 */
export interface DataSource {
  /** daysAhead: sorgu penceresi dünün başından bugün+daysAhead gününün sonuna (varsayılan 1 = yarın) */
  listMatches(sport: Sport, daysAhead?: number): Promise<Match[]>;
  getMatch(fixtureId: number): Promise<Match | null>;
  /** matches tablosundaki (seçili spor) INSERT/UPDATE değişikliklerini dinler. Aboneliği iptal eden fonksiyonu döndürür. */
  subscribeMatches(sport: Sport, onChange: (m: Match) => void): () => void;
  subscribeMatch(fixtureId: number, onChange: (m: Match) => void): () => void;
  /** Ücretli API planı mı (akıllı alarmlar yalnız o zaman üretilir). null = bilinmiyor (0015 kurulmadı) */
  /** Spor başına API planı (0018 api_paid_for; yoksa futbol için eski api_paid). null = bilinmiyor */
  isApiPaid(sport?: Sport): Promise<boolean | null>;
  /**
   * Ücretli futbol planında fikstürün kaç gün ileri çekildiği (0019 fixture_days_ahead, 1…7; sunucu ile aynı
   * kaynak). 0019 kurulmadıysa 7 (sunucu da varsayılan 7 kullanır). null = bilinmiyor (oturum yok / ağ hatası)
   */
  fixtureDaysAhead(): Promise<number | null>;
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
  /** Test aboneliği (simulate_subscription) yalnız izin listesindeki hesaplarda açık */
  isTestUser(): Promise<boolean>;
  /** Oturumdaki hesabın kimliği (Ayarlar'da gösterilir; test listesine eklemek için) */
  getAccountId(): Promise<string | null>;
  /** Hesabı ve ona bağlı tüm kullanıcı verisini kalıcı olarak siler; yeni anonim oturum açılır */
  deleteAccount(): Promise<void>;
  /**
   * F4: bugünü aktif gün olarak işaretler. true = kaydedildi ya da 0017 yok (bugün yeniden denenmez);
   * false = oturum yok / ağ hatası (sonraki açılışta yeniden denenir). Fırlatmaz.
   */
  touchActivity(): Promise<boolean>;
  /** F3: davet kodu + sayaç. null = 0017 kurulmadı / oturum yok (kart gizlenir); ağ hatasında fırlatır */
  getInvite(): Promise<InviteState | null>;
  /** F3: davet kodu girme. Ağ / oturum hatasında fırlatır (kart friendlyError gösterir) */
  redeemInvite(code: string): Promise<RedeemResult>;
  /** YALNIZCA TEST: gerçek ödeme entegrasyonu (RevenueCat / IAP) gelene kadar */
  simulateSubscription(plan: SubscriptionPlan | null): Promise<boolean>;
}
