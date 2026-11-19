/**
 * Uygulama içi değerlendirme (Play In-App Review) tetik kuralı — SAF modül (içe aktarma yok; Deno test eder:
 * supabase/functions/tests/reviewPolicy.test.ts). Yan etkili kısım: `src/lib/reviewPrompt.ts`.
 *
 * Politika (pazarlama §2 ve §4, Play "Ratings, Reviews and Installs"; expo-store-review rehberi):
 * - Nötr: önce "Uygulamayı sevdin mi?" gibi soru YOK, yalnız memnun görünen kullanıcıya filtre YOK;
 *   karar yalnız kullanım derinliğine bakar (aktif gün + tamamlanmış AI raporu görüntüleme).
 * - Ödül / teşvik yok; düğmeden çağrılmaz (Play kuralı + expo rehberi "Don't call from a button").
 * - Hatadan hemen sonra sorulmaz; canlı maç ekranında sorulmaz; 90 günde en çok bir kez denenir
 *   (Play kendi kotasıyla diyaloğu yine göstermeyebilir; deneme yine sayılır).
 */

export const REVIEW_RULES = {
  /** En az bu kadar ayrı TSİ gününde açılmış olmalı */
  minActiveDays: 4,
  /** Son tamamlanmış AI raporu görüntülemesi bu süre içinde olmalı (gerçek bir kullanım anının ardından) */
  aiViewWindowMs: 3 * 86_400_000,
  /** İki deneme arası en az */
  cooldownMs: 90 * 86_400_000,
  /** Bu oturumda gösterilen son hatadan sonra bekleme */
  errorQuietMs: 30 * 60_000,
  /** Saklanan aktif gün listesinin üst sınırı (yalnız sayım için) */
  maxStoredDays: 30,
} as const;

export type ReviewState = {
  /** Ayrı TSİ günleri (YYYY-MM-DD), artan */
  activeDays: string[];
  /** Son tamamlanmış AI raporu (maç sonu / maç önü) görüntüleme zamanı (ms) */
  lastAiViewAt: number | null;
  /** Son değerlendirme denemesi (ms) */
  lastPromptAt: number | null;
};

export type ReviewContext = {
  nowMs: number;
  /** Bu oturumda kullanıcıya gösterilen son hata (ms) ya da null */
  lastErrorAt: number | null;
  /** Canlı maç ekranı açık mı (tetik ana ekrandan çağrılır; yine de korunur) */
  onLiveMatchScreen: boolean;
  /** Platform diyaloğu destekliyor mu (`StoreReview.isAvailableAsync`) */
  available: boolean;
};

export type ReviewDecision =
  | { ask: true }
  | { ask: false; reason: 'unavailable' | 'live_screen' | 'recent_error' | 'cooldown' | 'few_days' | 'no_ai_view' };

export const EMPTY_REVIEW_STATE: ReviewState = { activeDays: [], lastAiViewAt: null, lastPromptAt: null };

const TSI_MS = 3 * 3600_000; // Türkiye sabit UTC+3 (src/lib/days.ts ile aynı kabul)
export const tsiDay = (nowMs: number): string => new Date(nowMs + TSI_MS).toISOString().slice(0, 10);

/** Bugünü (TSİ) ekler; tekrar eklemez; en yeni `maxStoredDays` gün kalır */
export function withActiveDay(s: ReviewState, nowMs: number): ReviewState {
  const day = tsiDay(nowMs);
  if (s.activeDays.includes(day)) return s;
  const days = [...s.activeDays, day].sort().slice(-REVIEW_RULES.maxStoredDays);
  return { ...s, activeDays: days };
}

export const withAiView = (s: ReviewState, nowMs: number): ReviewState => ({ ...s, lastAiViewAt: nowMs });
export const withPrompted = (s: ReviewState, nowMs: number): ReviewState => ({ ...s, lastPromptAt: nowMs });

/** Bozuk / eski saklı değer → güvenli durum */
export function parseReviewState(raw: string | null): ReviewState {
  if (!raw) return EMPTY_REVIEW_STATE;
  try {
    const o = JSON.parse(raw) as Partial<ReviewState>;
    const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
    const days = Array.isArray(o.activeDays) ? o.activeDays.filter((d): d is string => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) : [];
    return { activeDays: [...new Set(days)].sort().slice(-REVIEW_RULES.maxStoredDays), lastAiViewAt: num(o.lastAiViewAt), lastPromptAt: num(o.lastPromptAt) };
  } catch {
    return EMPTY_REVIEW_STATE;
  }
}

/** Karar. Sıra: platform → canlı ekran → yakın hata → bekleme süresi → aktif gün → AI görüntüleme */
export function shouldAskForReview(s: ReviewState, c: ReviewContext): ReviewDecision {
  if (!c.available) return { ask: false, reason: 'unavailable' };
  if (c.onLiveMatchScreen) return { ask: false, reason: 'live_screen' };
  if (c.lastErrorAt != null && c.nowMs - c.lastErrorAt < REVIEW_RULES.errorQuietMs) return { ask: false, reason: 'recent_error' };
  if (s.lastPromptAt != null && c.nowMs - s.lastPromptAt < REVIEW_RULES.cooldownMs) return { ask: false, reason: 'cooldown' };
  if (s.activeDays.length < REVIEW_RULES.minActiveDays) return { ask: false, reason: 'few_days' };
  if (s.lastAiViewAt == null || c.nowMs - s.lastAiViewAt > REVIEW_RULES.aiViewWindowMs || s.lastAiViewAt > c.nowMs) {
    return { ask: false, reason: 'no_ai_view' };
  }
  return { ask: true };
}
