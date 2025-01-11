import { AuthError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export const MAX_RETRIES = 3;
export const TIMEOUT_DURATION = 30000; // 30 seconds

export async function checkEmailExists(email: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('check_email_exists', {
    email_to_check: email
  });
  
  if (error) throw error;
  return data;
}

export async function cleanupFailedRegistration(userId: string) {
  try {
    await supabase.rpc('cleanup_failed_dealer_registration', {
      user_id: userId
    });
    await supabase.auth.signOut();
  } catch (error) {
    console.error('Cleanup failed:', error);
  }
}

export function getRegistrationErrorMessage(error: AuthError | Error): string {
  if ('code' in error) {
    switch (error.code) {
      case '23505':
        if (error.message.includes('tax_id_key')):
          return "This tax ID is already registered";
        return "A dealer profile already exists with these details";
      case 'P0001':
        return "Registration failed due to a database constraint";
      case 'timeout':
        return "Registration timed out. Please try again";
      default:
        return error.message;
    }
  }
  return error.message;
}

export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = TIMEOUT_DURATION
): Promise<T> {
  let timeoutId: NodeJS.Timeout;
  
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error('timeout'));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId);
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}