import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';
import { Platform } from 'react-native';
import { parseReferrer } from './store';
import { PREVIEW_MODE } from './supabase';

/**
 * Play Install Referrer → davet kodu ÖNERİSİ (docs/inovasyon-onerileri.md §0.8, pazarlama §9.1).
 * - Yalnız Android ve yalnız ilk açılışta bir kez okunur (`skor.referrer.checked`); hata yutulur.
 * - Geçerli kod bulunursa yalnız cihazda saklanır (`skor.referrer.code`). Sunucuya HİÇBİR ŞEY gitmez;
 *   kod ancak kullanıcı Ayarlar'daki davet kartında "Kaydet"e basınca mevcut `redeem` akışıyla gönderilir.
 *   Otomatik kayıt yok (şeffaflık; KVKK: referrer verisi cihazdan çıkmaz).
 * - Önizleme (web, e2e): `?referrer=<kodlu UTM>` URL parametresi aynı yoldan geçer (her yüklemede okunur).
 */
const CHECKED = 'skor.referrer.checked';
const CODE = 'skor.referrer.code';
const BANNER_HIDDEN = 'skor.referrer.bannerHidden';

let suggested: string | null = null;
let bannerHidden = false;
let started: Promise<void> | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function previewReferrer(): string | null {
  if (!PREVIEW_MODE || typeof globalThis.location === 'undefined') return null;
  const m = /[?&]referrer=([^&#]*)/.exec(globalThis.location.search ?? '');
  if (!m) return null;
  try {
    return decodeURIComponent(m[1]);
  } catch {
    return m[1];
  }
}

async function readOnce(): Promise<void> {
  try {
    const preview = previewReferrer();
    if (preview != null) {
      suggested = parseReferrer(preview).code;
      bannerHidden = false;
      return;
    }
    const [stored, hidden] = await Promise.all([AsyncStorage.getItem(CODE), AsyncStorage.getItem(BANNER_HIDDEN)]);
    suggested = stored;
    bannerHidden = hidden === '1';
    if (Platform.OS !== 'android' || PREVIEW_MODE) return;
    if ((await AsyncStorage.getItem(CHECKED)) === '1') return;
    // İlk açılış: Play'den kurulmadıysa (yan yükleme / geliştirme) referrer boş ya da hata → sessizce geç
    let raw: string | null = null;
    try {
      raw = await Application.getInstallReferrerAsync();
    } catch {
      raw = null;
    }
    const code = parseReferrer(raw).code;
    if (code) {
      await AsyncStorage.setItem(CODE, code);
      suggested = code;
    }
    await AsyncStorage.setItem(CHECKED, '1');
  } catch {
    /* ölçüm / öneri akışı uygulamayı durdurmaz */
  } finally {
    emit();
  }
}

/** Açılışta bir kez (`_layout.tsx`); sonraki çağrılar aynı sözü döndürür */
export function readInstallReferrerOnce(): Promise<void> {
  if (!started) started = readOnce();
  return started;
}

export const getSuggestedInviteCode = (): string | null => suggested;
export const isReferrerBannerHidden = (): boolean => bannerHidden;

/** "Kaydet" sonrası (sonuç ne olursa olsun) ya da "Bu kod değil": öneri silinir */
export async function clearSuggestedInviteCode(): Promise<void> {
  suggested = null;
  emit();
  try {
    await AsyncStorage.removeItem(CODE);
  } catch {
    /* yok say */
  }
}

/** Ana ekran bandı kapatıldı (öneri Ayarlar'da kalır) */
export async function hideReferrerBanner(): Promise<void> {
  bannerHidden = true;
  emit();
  try {
    await AsyncStorage.setItem(BANNER_HIDDEN, '1');
  } catch {
    /* yok say */
  }
}

export function subscribeReferrer(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
