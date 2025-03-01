
// Helper function to safely trim strings (handles null/undefined)
export const safeTrim = (value?: string): string => {
  if (value === undefined || value === null) {
    return '';
  }
  return value.trim();
};

/**
 * Validates email format
 */
export const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  if (!email || email.trim() === '') {
    return { isValid: false, error: 'Email is required' };
  }

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  return { isValid: true };
};

/**
 * Validates password strength
 */
export const validatePassword = (password: string): { isValid: boolean; error?: string } => {
  if (!password) {
    return { isValid: false, error: 'Password is required' };
  }

  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters' };
  }

  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one uppercase letter' };
  }

  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one lowercase letter' };
  }

  // Check for at least one number
  if (!/[0-9]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one number' };
  }

  return { isValid: true };
};

/**
 * Checks if an account already exists with the given email
 */
export const checkAccountExists = async (email: string): Promise<boolean> => {
  try {
    // Try searching in profiles table first (more reliable method)
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();
    
    if (profileError) {
      console.error("Error checking profiles table:", profileError);
    } else if (profileData) {
      return true; // Found a matching profile
    }
    
    // Try edge function method
    try {
      const { data: authData, error: authError } = await supabase.functions.invoke('dealer-auth', {
        body: {
          action: 'check-email-exists',
          email: email
        }
      });

      if (authError) {
        console.error("Error checking if email exists via edge function:", authError);
      } else {
        return authData?.exists || false;
      }
    } catch (e) {
      console.error("Error in edge function check:", e);
    }
    
    // Final attempt - query users directly (may not have permissions)
    try {
      // Note: This is likely to fail due to RLS, but we try as a last resort
      const { count, error: countError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('email', email);
        
      if (!countError && count && count > 0) {
        return true;
      }
    } catch (e) {
      console.error("Error in final users check:", e);
    }
    
    return false; // No evidence the email exists
  } catch (error) {
    console.error("Error in checkAccountExists:", error);
    return false;
  }
};

// Import supabase client
import { supabase } from "@/integrations/supabase/client";
