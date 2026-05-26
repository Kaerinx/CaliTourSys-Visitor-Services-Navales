import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

let supabaseInstance: SupabaseClient | null = null;

/**
 * Get or create a singleton Supabase client instance
 * This prevents multiple GoTrueClient instances warning
 */
export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    supabaseInstance = createSupabaseClient(
      `https://${projectId}.supabase.co`,
      publicAnonKey
    );
  }
  return supabaseInstance;
}

/**
 * Legacy alias for compatibility
 */
export const createClient = getSupabaseClient;
