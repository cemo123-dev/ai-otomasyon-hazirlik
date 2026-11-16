import { PREVIEW_MODE, supabase } from '../supabase';
import { createMockSource } from './mockSource';
import { createSupabaseSource } from './supabaseSource';
import type { DataSource } from './types';

export const dataSource: DataSource =
  PREVIEW_MODE || !supabase ? createMockSource() : createSupabaseSource(supabase);

export type { DataSource };
