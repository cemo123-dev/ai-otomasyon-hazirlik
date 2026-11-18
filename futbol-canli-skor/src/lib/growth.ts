import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { dataSource } from './data';
import { PREVIEW_MODE } from './supabase';

/**
 * İndirme sayfası (F3 paylaşım ve davet bağlantıları). EAS ortam değişkeni `EXPO_PUBLIC_DOWNLOAD_URL`
 * (gizli değil). Tanımlı değilse boş = null: "Paylaş" düğmesi ve davet kartı hiç çizilmez.
 * Önizlemede e2e için sabit örnek adres (`.invalid` alan adı hiçbir yere gitmez).
 */
const ENV_DOWNLOAD_URL = process.env.EXPO_PUBLIC_DOWNLOAD_URL?.trim() ?? '';
const PREVIEW_DOWNLOAD_URL = 'https://ornek.invalid/skorplus';

export function getDownloadUrl(): string | null {
  if (ENV_DOWNLOAD_URL) return ENV_DOWNLOAD_URL;
  if (!PREVIEW_MODE) return null;
  // e2e: ?dl=0 → adres tanımlı değilmiş gibi (Paylaş ve davet kartı gizli)
  const search = typeof globalThis.location !== 'undefined' ? (globalThis.location.search ?? '') : '';
  return /[?&]dl=0(?:&|$)/.test(search) ? null : PREVIEW_DOWNLOAD_URL;
}

// Son başarılı kaydın TSİ günü (YYYY-MM-DD). Döngü 6 bulgu 8: saatlik aralık gece yarısını kaçırıyordu
// (23:40 + 00:20 → yeni gün yazılmıyordu) ve zaman damgası RPC'den önce yazıldığı için çevrimdışı açılış
// bir saat yeniden denenmiyordu.
const KEY = 'skor.activity.lastDay';
// Türkiye 2016'dan beri sabit UTC+3 (yaz saati yok) — src/lib/days.ts ile aynı kabul; sunucu da Europe/Istanbul
const TSI_MS = 3 * 3600_000;
const istanbulDay = (nowMs: number) => new Date(nowMs + TSI_MS).toISOString().slice(0, 10);
let started = false;
let inFlight = false;

/**
 * Günde en fazla 1 başarılı RPC; anahtar yalnız RPC hatasız dönünce yazılır (hata → sonraki açılışta yeniden).
 * Davet eden başına 24 saatte 5 aktif sınırına takılan davetli için istemci tekrar denemez: sunucu
 * (0018 `skor-invite-recount`, saatlik) bekleyenleri sınır boşaldıkça kendisi sayar (Döngü 7 bulgu 8).
 */
async function touchDaily(): Promise<void> {
  if (inFlight) return;
  inFlight = true;
  try {
    const today = istanbulDay(Date.now());
    if ((await AsyncStorage.getItem(KEY)) === today) return;
    if (await dataSource.touchActivity()) await AsyncStorage.setItem(KEY, today);
  } catch {
    /* ölçüm akışı durdurmaz */
  } finally {
    inFlight = false;
  }
}

/** F4 aktif gün: soğuk açılış + arka plandan dönüş. D7 için ertesi gün açılışlar da sayılır. */
export function startActivityTracking(): () => void {
  if (started) return () => {};
  started = true;
  void touchDaily();
  const sub = AppState.addEventListener('change', (s) => {
    if (s === 'active') void touchDaily();
  });
  return () => {
    sub.remove();
    started = false;
  };
}
