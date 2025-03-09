
import { supabase } from "@/integrations/supabase/client";

/**
 * Sign in with email and password
 */
export async function signInWithEmail({ email, password }: { email: string; password: string }) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.error("Sign in error:", error);
      return { error };
    }
    
    return { data, error: null };
  } catch (error) {
    console.error("Sign in exception:", error);
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }
}
