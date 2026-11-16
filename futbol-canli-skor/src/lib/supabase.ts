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
export async function ensureSession(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  if (data.session) return data.session.user.id;
  const { data: anon, error } = await supabase.auth.signInAnonymously();
  if (error) {
    console.warn('[supabase] anonim oturum açılamadı:', error.message);
    return null;
  }
  return anon.user?.id ?? null;
}
