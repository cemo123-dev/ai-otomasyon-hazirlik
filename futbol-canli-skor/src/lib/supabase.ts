import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Önizleme modu: Supabase bilgileri yoksa ya da EXPO_PUBLIC_PREVIEW_MODE=1 ise
 * uygulama mock veri kaynağıyla çalışır (bkz. src/lib/data/mock.ts).
 */
export const PREVIEW_MODE = process.env.EXPO_PUBLIC_PREVIEW_MODE === '1' || !url || !anonKey;

export const supabase: SupabaseClient | null = PREVIEW_MODE
  ? null
  : createClient(url!, anonKey!, {
      auth: {
        // Web'de SSR sırasında window yok; AsyncStorage yalnızca native'de gerekli
        storage: Platform.OS === 'web' ? undefined : AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
      realtime: { params: { eventsPerSecond: 10 } },
    });

// Uygulama ön plandayken token'ı otomatik yenile (Supabase RN önerisi)
if (supabase && Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

/**
 * RPC'ler auth.uid() ister. Kullanıcı giriş yapmamışsa anonim oturum açılır
 * (Supabase Dashboard > Auth > "Allow anonymous sign-ins" açık olmalı).
 */
// Tek uçuş: ilk açılışta eşzamanlı çağrılar (Pro, takip, test hesabı …) aynı oturum isteğini paylaşır;
// aksi halde her biri ayrı signInAnonymously() ile kurulum başına birden çok anonim kullanıcı açar.
let inflight: Promise<string | null> | null = null;

export function ensureSession(): Promise<string | null> {
  if (!supabase) return Promise.resolve(null);
  if (!inflight) {
    inflight = resolveSession(supabase).finally(() => {
      inflight = null; // sonuç oturumda saklı; bir sonraki çağrı getSession ile hızlıca döner
    });
  }
  return inflight;
}

async function resolveSession(sb: SupabaseClient): Promise<string | null> {
  const { data } = await sb.auth.getSession();
  if (data.session) return data.session.user.id;
  const { data: anon, error } = await sb.auth.signInAnonymously();
  if (error) {
    console.warn('[supabase] anonim oturum açılamadı:', error.message);
    return null;
  }
  return anon.user?.id ?? null;
}
