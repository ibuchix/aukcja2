
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
    // Use direct database query approach instead of edge function
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', supabase.auth.user()?.id)
      .maybeSingle();
    
    if (userError) {
      console.error("Error checking profiles:", userError);
    } else if (userData) {
      return true; // Found a matching profile
    }
    
    // Fallback: check if auth can send a reset password to this email
    try {
      const { error } = await supabase.auth.api.resetPasswordForEmail(email, {
        redirectTo: window.location.origin
      });

      // If there's no error, the email exists
      if (!error) {
        return true;
      }
      
      // If the error is "User not found", the email doesn't exist
      if (error && error.message && error.message.toLowerCase().includes('user not found')) {
        return false;
      }
      
      // For any other error, we'll need to be cautious and assume the email might exist
      console.error("Error checking email existence:", error);
      return false;
    } catch (e) {
      console.error("Error in email existence check:", e);
      return false;
    }
  } catch (error) {
    console.error("Error in checkAccountExists:", error);
    return false;
  }
};

// Import supabase client
import { supabase } from "@/integrations/supabase/client";
