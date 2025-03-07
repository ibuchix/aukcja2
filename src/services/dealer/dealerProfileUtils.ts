
import { supabase } from "@/integrations/supabase/client";
import { DealerInsert, ProfileInsert } from "@/utils/databaseTypes";
import { executeWithRetry, SupabaseResponse } from "@/utils/retryUtils";
import { filterString } from "@/utils/supabaseHelpers";

export async function createProfileRecord(
  userId: string,
  profileData: Omit<ProfileInsert, 'id'>
): Promise<SupabaseResponse> {
  try {
    // Check if profile exists before creating
    // Use the simplified helper function
    const idColumn = filterString('profiles', 'id', userId);
    const existingProfile = await supabase
      .from('profiles')
      .select('id')
      .eq(idColumn, userId)
      .maybeSingle();
    
    // Only create if it doesn't exist
    if (!existingProfile.data) {
      return await supabase
        .from('profiles')
        .insert({
          ...profileData,
          id: userId
        } as any);
    }
    
    return { data: existingProfile.data, error: null };
  } catch (error) {
    console.error("Error in createProfileRecord:", error);
    return { data: null, error: error as Error };
  }
}

export async function createDealerRecord(
  dealerData: DealerInsert & { user_id: string }
): Promise<SupabaseResponse> {
  try {
    return await supabase
      .from('dealers')
      .insert(dealerData as any);
  } catch (error) {
    console.error("Error in createDealerRecord:", error);
    return { data: null, error: error as Error };
  }
}
