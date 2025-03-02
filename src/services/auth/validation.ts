
import { supabase } from "@/integrations/supabase/client";

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Safely trims a string with null/undefined handling
 */
export const safeTrim = (str: string | null | undefined): string => {
  return str ? str.trim() : '';
};

/**
 * Validates an email address using regex
 */
export function validateEmail(email: string | null | undefined): ValidationResult {
  if (!email) {
    return { isValid: false, error: "Email is required" };
  }

  const trimmedEmail = email.trim();
  
  if (!trimmedEmail) {
    return { isValid: false, error: "Email is required" };
  }

  // Simple regex for basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    return { isValid: false, error: "Please enter a valid email address" };
  }

  return { isValid: true };
}

/**
 * Validates a password with security requirements
 */
export function validatePassword(password: string | null | undefined): ValidationResult {
  if (!password) {
    return { isValid: false, error: "Password is required" };
  }

  if (password.length < 8) {
    return { isValid: false, error: "Password must be at least 8 characters long" };
  }

  // Check for at least one number
  if (!/\d/.test(password)) {
    return { isValid: false, error: "Password must contain at least one number" };
  }

  // Check for at least one letter
  if (!/[a-zA-Z]/.test(password)) {
    return { isValid: false, error: "Password must contain at least one letter" };
  }

  return { isValid: true };
}

/**
 * Checks if an account already exists with the given email
 * Uses multiple methods for robustness
 */
export async function checkAccountExists(email: string): Promise<boolean> {
  try {
    console.log("Checking if account exists with email:", email);
    
    // Try all available methods to check email existence
    
    // 1. First try using the dealer-auth edge function (most reliable)
    try {
      const { data: edgeData, error: edgeError } = await supabase.functions.invoke('dealer-auth', {
        body: { action: 'checkEmailExists', email: email.toLowerCase().trim() }
      });
      
      if (!edgeError && edgeData) {
        console.log("Edge function response:", edgeData);
        return edgeData?.exists || false;
      }
      
      if (edgeError) {
        console.warn("Edge function error checking email:", edgeError);
        // Continue to next method
      }
    } catch (error) {
      console.warn("Failed to call edge function:", error);
      // Continue to next method
    }
    
    // 2. Try using a direct query instead of RPC (which has type compatibility issues)
    try {
      // Direct query to the auth.users table using service role client
      // This is done via the edge function to maintain security
      const { data: directData, error: directError } = await supabase.functions.invoke('dealer-auth', {
        body: { 
          action: 'directCheckEmail', 
          email: email.toLowerCase().trim() 
        }
      });
      
      if (!directError) {
        console.log("Direct query response:", directData);
        return Boolean(directData?.exists);
      } else {
        console.warn("Direct query error:", directError);
        // Continue to fallback
      }
    } catch (error) {
      console.warn("Failed direct query attempt:", error);
      // Continue to fallback
    }
    
    // 3. Last resort: just return false and let the registration attempt proceed
    // The server-side validation will catch any duplicates
    console.warn("All email check methods failed, assuming email doesn't exist");
    return false;
    
  } catch (error) {
    console.error("Unhandled error checking if account exists:", error);
    // In case of unhandled errors, default to false to allow registration attempt
    // The server will validate and reject if needed
    return false;
  }
}
