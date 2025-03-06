
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";

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
 * Improved method to check if an account exists with the given email
 * Uses multiple verification approaches for reliability
 */
export async function checkAccountExists(email: string): Promise<boolean> {
  try {
    console.log("Checking if account exists with email:", email);
    
    // Try all available methods to verify email existence
    
    // Method 1: Direct check using get_user_id_by_email function
    try {
      const { data: userData, error: userError } = await supabase.rpc(
        'get_user_id_by_email',
        { p_email: email.toLowerCase().trim() }
      );
      
      if (!userError && userData) {
        // Check if userData has an id property
        const userId = userData.id;
        if (userId) {
          console.log("User exists according to get_user_id_by_email:", userData);
          return true;
        }
      }
      
      if (userError) {
        console.warn("Error checking user with get_user_id_by_email:", userError);
        // Continue to next method
      }
    } catch (error) {
      console.warn("Failed to call get_user_id_by_email:", error);
      // Continue to next method
    }
    
    // Method 2: Check using check_email_exists function
    try {
      const { data: emailData, error: emailError } = await supabase.rpc(
        'check_email_exists',
        { p_email: email.toLowerCase().trim() }
      );
      
      if (!emailError && emailData) {
        console.log("User exists according to check_email_exists:", emailData);
        // Check if emailData has an exists property
        if (typeof emailData === 'object' && 'exists' in emailData) {
          return emailData.exists === true;
        }
      }
      
      if (emailError) {
        console.warn("Error checking email with check_email_exists:", emailError);
        // Continue to next method
      }
    } catch (error) {
      console.warn("Failed to call check_email_exists:", error);
      // Continue to next method
    }
    
    // Method 3: Try using the older format function
    try {
      const { data: legacyData, error: legacyError } = await supabase.rpc(
        'check_email_exists',
        { email_to_check: email.toLowerCase().trim() }
      );
      
      if (!legacyError) {
        console.log("Legacy check_email_exists response:", legacyData);
        
        if (typeof legacyData === 'number') {
          return legacyData > 0;
        } 
        
        if (typeof legacyData === 'boolean') {
          return legacyData;
        }
      } else {
        console.warn("Legacy function error:", legacyError);
      }
    } catch (error) {
      console.warn("Failed to call legacy check function:", error);
    }
    
    // Method 4: Edge function fallback
    try {
      const { data: edgeData, error: edgeError } = await supabase.functions.invoke('dealer-auth', {
        body: { action: 'checkEmailExists', email: email.toLowerCase().trim() }
      });
      
      if (!edgeError && edgeData) {
        console.log("Edge function response:", edgeData);
        if (typeof edgeData === 'object' && edgeData.exists !== undefined) {
          return edgeData.exists === true;
        }
      }
    } catch (error) {
      console.warn("Failed to call edge function:", error);
    }
    
    // Method 5: Direct query as last resort (this may fail due to RLS)
    try {
      const { count, error } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('id', await getUserIdByEmail(email));
      
      if (!error && count !== null && count > 0) {
        console.log("User exists based on profiles count:", count);
        return true;
      }
    } catch (error) {
      console.warn("Failed to check profile count:", error);
    }
    
    // If all checks failed, default to false - request will fail gracefully with appropriate message
    console.warn("All email existence checks failed, assuming email doesn't exist");
    return false;
    
  } catch (error) {
    console.error("Unhandled error checking if account exists:", error);
    // In case of unhandled errors, default to false for fail-safe behavior
    return false;
  }
}

/**
 * Helper function to get user ID by email
 */
async function getUserIdByEmail(email: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('auth.users')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .single();
    
    if (error || !data) {
      return null;
    }
    
    return data.id;
  } catch (error) {
    return null;
  }
}
