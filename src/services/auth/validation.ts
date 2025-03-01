
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
    // First try direct Supabase check
    const { data: user, error } = await supabase.auth.admin.getUserByEmail(email);
    
    if (error) {
      console.error("Error checking if email exists via admin API:", error);
      
      // Try edge function as fallback
      const { data: authData, error: authError } = await supabase.functions.invoke('dealer-auth', {
        body: {
          action: 'check-email-exists',
          email: email
        }
      });

      if (authError) {
        console.error("Error checking if email exists via edge function:", authError);
        throw authError;
      }

      return authData?.exists || false;
    }
    
    return !!user;
  } catch (error) {
    console.error("Error in checkAccountExists:", error);
    
    // In case of errors, try a simple query to see if the email exists in profiles
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();
        
      if (error) {
        console.error("Error checking profiles table:", error);
        return false;
      }
      
      return !!data;
    } catch (e) {
      console.error("Error in fallback check:", e);
      return false;
    }
  }
};

// Import supabase client
import { supabase } from "@/integrations/supabase/client";
