
// Re-export the enhanced Supabase client to maintain compatibility
// This ensures all existing imports continue to work while using the enhanced client
import { enhancedSupabase } from '@/utils/enhancedSupabaseClient';

export const supabase = enhancedSupabase;
