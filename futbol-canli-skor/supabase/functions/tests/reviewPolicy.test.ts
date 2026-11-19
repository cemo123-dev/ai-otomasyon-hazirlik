// src/lib/reviewPolicy.ts (uygulama içi değerlendirme tetik kuralı) — saf modül. npm run test:functions.
// Politika: nötr (memnuniyet filtresi yok), hatadan sonra değil, canlı maç ekranında değil, 90 günde bir.
import { assert, assertEquals } from 'jsr:@std/assert@1';
import {
  EMPTY_REVIEW_STATE,
  parseReviewState,
  REVIEW_RULES,
  type ReviewContext,
  type ReviewState,
  shouldAskForReview,
  tsiDay,
  withActiveDay,
  withAiView,
  withPrompted,
} from '../../../src/lib/reviewPolicy.ts';

const DAY = 86_400_000;
const NOW = Date.parse('2026-11-19T12:00:00Z');
const ctx = (o: Partial<ReviewContext> = {}): ReviewContext => ({ nowMs: NOW, lastErrorAt: null, onLiveMatchScreen: false, available: true, ...o });
const engaged = (o: Partial<ReviewState> = {}): ReviewState => ({
  activeDays: ['2026-11-10', '2026-11-12', '2026-11-15', '2026-11-19'],
  lastAiViewAt: NOW - 3600_000,
  lastPromptAt: null,
  ...o,
});

Deno.test('uygun: 4 aktif gün + son 3 günde tamamlanmış AI raporu', () => {
  assertEquals(shouldAskForReview(engaged(), ctx()), { ask: true });
});

Deno.test('az aktif gün → few_days', () => {
  assertEquals(shouldAskForReview(engaged({ activeDays: ['2026-11-18', '2026-11-19'] }), ctx()), { ask: false, reason: 'few_days' });
});

Deno.test('AI raporu görülmedi / eski / gelecekte → no_ai_view', () => {
  assertEquals(shouldAskForReview(engaged({ lastAiViewAt: null }), ctx()), { ask: false, reason: 'no_ai_view' });
  assertEquals(shouldAskForReview(engaged({ lastAiViewAt: NOW - 4 * DAY }), ctx()), { ask: false, reason: 'no_ai_view' });
  assertEquals(shouldAskForReview(engaged({ lastAiViewAt: NOW + DAY }), ctx()), { ask: false, reason: 'no_ai_view' });
});

Deno.test('90 gün bekleme: 89. gün hayır, 90. gün evet', () => {
  assertEquals(shouldAskForReview(engaged({ lastPromptAt: NOW - 89 * DAY }), ctx()), { ask: false, reason: 'cooldown' });
  assertEquals(shouldAskForReview(engaged({ lastPromptAt: NOW - 90 * DAY }), ctx()), { ask: true });
});

Deno.test('hatadan sonra 30 dk sorulmaz', () => {
  assertEquals(shouldAskForReview(engaged(), ctx({ lastErrorAt: NOW - 60_000 })), { ask: false, reason: 'recent_error' });
  assertEquals(shouldAskForReview(engaged(), ctx({ lastErrorAt: NOW - REVIEW_RULES.errorQuietMs })), { ask: true });
});

Deno.test('canlı maç ekranında ve platform desteklemezken sorulmaz (öncelik sırası)', () => {
  assertEquals(shouldAskForReview(engaged(), ctx({ onLiveMatchScreen: true })), { ask: false, reason: 'live_screen' });
  assertEquals(shouldAskForReview(engaged(), ctx({ available: false, onLiveMatchScreen: true })), { ask: false, reason: 'unavailable' });
});

Deno.test('nötr: karar yalnız kullanım derinliğine bakar (memnuniyet alanı yok)', () => {
  const keys = Object.keys(EMPTY_REVIEW_STATE).sort();
  assertEquals(keys, ['activeDays', 'lastAiViewAt', 'lastPromptAt']);
  assert(!keys.some((k) => /rating|happy|sentiment|like/i.test(k)));
});

Deno.test('withActiveDay: TSİ gün sınırı, tekrar eklemez, üst sınır', () => {
  // 20:59 UTC = 23:59 TSİ, 21:00 UTC = ertesi gün 00:00 TSİ
  assertEquals(tsiDay(Date.parse('2026-11-19T20:59:00Z')), '2026-11-19');
  assertEquals(tsiDay(Date.parse('2026-11-19T21:00:00Z')), '2026-11-20');
  let s = withActiveDay(EMPTY_REVIEW_STATE, NOW);
  assertEquals(withActiveDay(s, NOW + 3600_000), s);
  for (let i = 1; i <= 40; i++) s = withActiveDay(s, NOW + i * DAY);
  assertEquals(s.activeDays.length, REVIEW_RULES.maxStoredDays);
  assertEquals(s.activeDays.at(-1), tsiDay(NOW + 40 * DAY));
});

Deno.test('withAiView / withPrompted ve deneme sonrası bekleme', () => {
  let s = engaged({ lastAiViewAt: null });
  s = withAiView(s, NOW);
  assertEquals(shouldAskForReview(s, ctx()), { ask: true });
  s = withPrompted(s, NOW);
  assertEquals(shouldAskForReview(s, ctx({ nowMs: NOW + DAY })), { ask: false, reason: 'cooldown' });
});

Deno.test('parseReviewState: bozuk / eksik / yabancı değer güvenli', () => {
  assertEquals(parseReviewState(null), EMPTY_REVIEW_STATE);
  assertEquals(parseReviewState('{bozuk'), EMPTY_REVIEW_STATE);
  assertEquals(parseReviewState(JSON.stringify({ activeDays: ['2026-11-19', 'x', 3, '2026-11-19'], lastAiViewAt: 'dün', lastPromptAt: 5 })), {
    activeDays: ['2026-11-19'],
    lastAiViewAt: null,
    lastPromptAt: 5,
  });
});
