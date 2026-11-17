import { supabase } from '../supabase';
import { createSupabaseSource } from './supabaseSource';
import type { DataSource } from './types';

/**
 * Önizleme (örnek veri) yalnız EXPO_PUBLIC_PREVIEW_MODE=1 iken veya Supabase bilgileri
 * yoksa kullanılır. Koşul bu dosyada doğrudan process.env ile yazılır: EXPO_PUBLIC_
 * değişkenleri derlemede gömüldüğü için production paketinde koşul sabitlenir ve
 * mockSource require'ı (örnek veriler dahil) pakete girmez.
 */
// supabase istemcisi tam olarak bu koşulda null'dur (bkz. ../supabase.ts PREVIEW_MODE)
export const dataSource: DataSource =
  process.env.EXPO_PUBLIC_PREVIEW_MODE === '1' || !process.env.EXPO_PUBLIC_SUPABASE_URL || !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
    ? // eslint-disable-next-line @typescript-eslint/no-require-imports -- koşullu yükleme için bilinçli
      (require('./mockSource') as typeof import('./mockSource')).createMockSource()
    : createSupabaseSource(supabase!);

export type { DataSource };
