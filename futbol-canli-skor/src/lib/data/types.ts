import type {
  AnalysisRequestResult,
  AnyTacticalPayload,
  Match,
  PreviewPayload,
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
  getPremium(): Promise<boolean>;
  /** YALNIZCA TEST: gerçek ödeme entegrasyonu (RevenueCat / IAP) gelene kadar */
  simulateSubscription(plan: SubscriptionPlan | null): Promise<boolean>;
}
