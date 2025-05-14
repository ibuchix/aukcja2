
import {
  Session,
  User,
} from "@supabase/supabase-js";
import { Database } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "@/types/profile";
import { isValidRecord } from "@/utils/supabaseHelpers";

/**
 * Type for the authentication context
 */
export interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  updateProfile: (updates: { [key: string]: any }) => Promise<void>;
  fetchProfile: () => Promise<void>;
  fetchDealerProfile: (userId: string) => Promise<any>;
  fetchCompleteProfile: (userId: string) => Promise<any>;
}

/**
 * Initial authentication context state
 */
export const initialAuthState: AuthContextType = {
  session: null,
  user: null,
  profile: null,
  isLoading: true,
  signOut: async () => {},
  updateProfile: async () => {},
  fetchProfile: async () => {},
  fetchDealerProfile: async () => {},
  fetchCompleteProfile: async () => {},
};

/**
 * Creates types for the complete dealer profile
 */
export interface CompleteProfile {
  id: string;
  user_id: string;
  dealership_name: string;
  supervisor_name: string;
  tax_id: string;
  business_registry_number: string;
  address: string;
  verification_status: string;
  is_verified: boolean;
  license_number?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Signs out the current user
 */
export async function signOutUser() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { success: false, error };
    }
    return { success: true };
  } catch (error) {
    console.error("Error signing out:", error);
    return { success: false, error };
  }
}

/**
 * Refreshes the user session
 */
export async function refreshUserSession() {
  try {
    const { data, error } = await supabase.auth.refreshSession();
    const { session, user } = data;
    
    if (error) {
      return { success: false, error };
    }
    
    return { success: true, session, user };
  } catch (error) {
    console.error("Error refreshing session:", error);
    return { success: false, error };
  }
}

/**
 * Fetches user profile data
 */
export async function fetchProfile(userId: string | undefined): Promise<Profile | null> {
  if (!userId) {
    console.warn("No user ID provided for fetching profile.");
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      return null;
    }

    return data || null;
  } catch (error) {
    console.error("Unexpected error fetching profile:", error);
    return null;
  }
}

/**
 * Updates user profile data
 */
export async function updateProfile(
  userId: string,
  updates: { [key: string]: any }
): Promise<void> {
  try {
    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error("Error updating profile:", error);
    throw error;
  }
}

/**
 * Fetches dealer profile data for the given user
 */
export async function fetchDealerProfile(userId: string) {
  if (!userId) {
    console.warn("fetchDealerProfile called without a userId");
    return null;
  }

  try {
    const { data: dealerData, error } = await supabase
      .from("dealers")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Error fetching dealer profile:", error);
      return null;
    }

    if (!dealerData) {
      return null;
    }

    return dealerData;
  } catch (err) {
    console.error("Error in fetchDealerProfile:", err);
    return null;
  }
}

/**
 * Fetches the complete dealer profile with all related information
 */
export async function fetchCompleteProfile(userId: string): Promise<CompleteProfile | null> {
  try {
    // Fetch the dealer profile
    const { data: dealerData, error: dealerError } = await supabase
      .from("dealers")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (dealerError || !dealerData) {
      console.error("Error fetching dealer profile:", dealerError);
      return null;
    }

    // Type guard to ensure dealerData is valid
    if (!isValidRecord<CompleteProfile>(dealerData)) {
      console.error("Invalid dealer profile data");
      return null;
    }

    return dealerData;
  } catch (err) {
    console.error("Error in fetchCompleteProfile:", err);
    return null;
  }
}
