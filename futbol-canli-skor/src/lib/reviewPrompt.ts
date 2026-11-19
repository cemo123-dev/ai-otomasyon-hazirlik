import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';
import { Platform } from 'react-native';
import { getLastAppErrorAt, isOnLiveScreen } from './appSignals';
import { parseReviewState, shouldAskForReview, withActiveDay, withAiView, withPrompted, type ReviewState } from './reviewPolicy';
import { PREVIEW_MODE } from './supabase';

/**
 * Uygulama içi değerlendirme (P3): kural `reviewPolicy.ts`'te (saf, Deno testli). Burada yalnız saklama ve
 * `expo-store-review` çağrısı. Önizlemede (web, e2e) ve Android dışında hiç çalışmaz.
 * Tetik noktası: ana ekran odaklanınca (maç ekranından dönüş) — okuma sırasında ve canlı maçta araya girmez.
 */
const KEY = 'skor.review.v1';
const ENABLED = Platform.OS === 'android' && !PREVIEW_MODE;
let busy = false;

async function load(): Promise<ReviewState> {
  return parseReviewState(await AsyncStorage.getItem(KEY));
}
async function save(s: ReviewState): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(s));
}

/** Tamamlanmış AI raporu (maç sonu / maç önü) ekranda gösterildi */
export async function noteAiReportViewed(): Promise<void> {
  if (!ENABLED) return;
  try {
    await save(withAiView(await load(), Date.now()));
  } catch {
    /* yok say */
  }
}

/** Ana ekran odaklandığında: bugünü say, kural uygunsa bir kez değerlendirme iste */
export async function maybeAskForReview(): Promise<void> {
  if (!ENABLED || busy) return;
  busy = true;
  try {
    const now = Date.now();
    let s = withActiveDay(await load(), now);
    const decision = shouldAskForReview(s, {
      nowMs: now,
      lastErrorAt: getLastAppErrorAt(),
      onLiveMatchScreen: isOnLiveScreen(),
      available: await StoreReview.isAvailableAsync().catch(() => false),
    });
    if (decision.ask) {
      // Önce kaydet: diyalog gösterilmese de (Play kotası) 90 gün yeniden denenmez
      s = withPrompted(s, now);
      await save(s);
      await StoreReview.requestReview().catch(() => {});
    } else {
      await save(s);
    }
  } catch {
    /* değerlendirme isteği akışı durdurmaz */
  } finally {
    busy = false;
  }
}
