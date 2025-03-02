
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
 */
export async function checkAccountExists(email: string): Promise<boolean> {
  try {
    console.log("Checking if account exists with email:", email);
    
    // First try using the RPC function
    const { data: count, error: rpcError } = await supabase.rpc('check_email_exists', {
      email_to_check: email.toLowerCase().trim()
    });
    
    if (rpcError) {
      console.warn("Error using RPC to check email, falling back to edge function:", rpcError);
      
      // Fall back to using the dealer-auth edge function
      const { data, error } = await supabase.functions.invoke('dealer-auth', {
        body: { action: 'checkEmailExists', email: email.toLowerCase().trim() }
      });
      
      if (error) {
        console.error("Edge function error checking email:", error);
        throw new Error(`Error checking if email exists: ${error.message}`);
      }
      
      return data?.exists || false;
    }
    
    return count > 0;
  } catch (error) {
    console.error("Error checking if account exists:", error);
    throw new Error("Error checking if account already exists");
  }
}
