
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "@/types/profile";
import { isValidRecord, isSelectQueryError } from "@/utils/supabaseHelpers";

// Define an interface for the session info
export interface SessionData {
  user: {
    id: string;
    email: string;
    role?: string;
  } | null;
  session: any;
  isAuthenticated: boolean;
}

/**
 * Fetches user profile by ID
 */
export async function fetchUserProfile(userId: string): Promise<Profile | null> {
  if (!userId) return null;

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }

    if (!data) return null;

    // Ensure we have a valid record before returning
    if (isValidRecord<Profile>(data)) {
      return data;
    }
    
    return null;
  } catch (err) {
    console.error("Exception fetching user profile:", err);
    return null;
  }
}

/**
 * Fetches dealer profile by user ID
 */
export async function fetchDealerProfile(userId: string) {
  if (!userId) return null;

  try {
    const { data, error } = await supabase
      .from("dealers")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Error fetching dealer profile:", error);
      return null;
    }

    return data || null;
  } catch (err) {
    console.error("Exception fetching dealer profile:", err);
    return null;
  }
}

/**
 * Get session data including user info and authentication status
 */
export async function getUserSessionInfo(): Promise<SessionData> {
  try {
    const { data: sessionData, error } = await supabase.auth.getSession();

    if (error) {
      console.error("Error getting session:", error);
      return { user: null, session: null, isAuthenticated: false };
    }

    const session = sessionData?.session;
    const user = session?.user || null;

    return {
      user: user ? {
        id: user.id,
        email: user.email || '',
        role: (user.user_metadata?.role as string) || undefined
      } : null,
      session,
      isAuthenticated: !!session
    };
  } catch (err) {
    console.error("Exception getting session:", err);
    return { user: null, session: null, isAuthenticated: false };
  }
}

/**
 * Sign out the current user
 */
export async function signOutUser() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Exception signing out:", err);
    return false;
  }
}

/**
 * Refresh the current session
 */
export async function refreshUserSession(): Promise<boolean> {
  try {
    const { error } = await supabase.auth.refreshSession();
    if (error) {
      console.error("Error refreshing session:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Exception refreshing session:", err);
    return false;
  }
}
