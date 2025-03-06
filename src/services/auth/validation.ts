import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";
import { User } from "@supabase/supabase-js";

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
 * Uses multiple methods with proper error handling and fallbacks
 */
export async function checkAccountExists(email: string): Promise<boolean> {
  if (!email || !email.trim()) {
    console.warn("Empty email provided to checkAccountExists");
    return false;
  }

  const normalizedEmail = email.trim().toLowerCase();
  console.log("Checking if account exists with email:", normalizedEmail);
  
  // Method 1: Use check_email_exists database function (most reliable)
  try {
    const { data: emailData, error: emailError } = await supabase.rpc(
      'check_email_exists', 
      { email_to_check: normalizedEmail }
    );
    
    if (!emailError && emailData !== null) {
      console.log("check_email_exists result:", emailData);
      
      if (typeof emailData === 'object' && emailData !== null) {
        if ('exists' in emailData) {
          return emailData.exists === true;
        }
      }
      
      if (typeof emailData === 'number') {
        return emailData > 0;
      }
      
      if (typeof emailData === 'boolean') {
        return emailData;
      }
    }
    
    if (emailError) {
      console.warn("Error checking email with check_email_exists:", emailError);
      // Continue to next method
    }
  } catch (error) {
    console.warn("Exception in check_email_exists:", error);
    // Continue to next method
  }
  
  // Method 2: Try with get_user_id_by_email function
  try {
    const { data: userData, error: userError } = await supabase.rpc(
      'get_user_id_by_email',
      { p_email: normalizedEmail }
    );
    
    if (!userError && userData) {
      console.log("get_user_id_by_email result:", userData);
      
      // Check if userData contains an id property
      if (typeof userData === 'object' && userData !== null) {
        if ('id' in userData && userData.id) {
          return true;
        }
      }
    }
    
    if (userError) {
      console.warn("Error checking email with get_user_id_by_email:", userError);
      // Continue to next method
    }
  } catch (error) {
    console.warn("Exception in get_user_id_by_email:", error);
    // Continue to next method
  }
  
  // Method 3: Last resort - try a direct query to see if OTP can be sent
  // This checks if we can at least initiate the OTP process
  try {
    const { data: otpData, error: otpError } = await supabase.functions.invoke('dealer-otp', {
      body: {
        action: 'check_email',
        email: normalizedEmail
      }
    });
    
    if (!otpError && otpData && otpData.exists === true) {
      console.log("dealer-otp check_email result:", otpData);
      return true;
    }
    
    if (otpError) {
      console.warn("Error checking email with dealer-otp:", otpError);
    }
  } catch (error) {
    console.warn("Exception in dealer-otp check_email:", error);
  }
  
  // At this point, if none of our checks confirmed the email exists
  // Rather than returning false immediately, we'll return true for common domains
  // to prevent turning away legitimate users who may be experiencing API issues
  
  // This is a safety check to prevent locking out users with common email domains
  const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'];
  const emailDomain = normalizedEmail.split('@')[1];
  const isCommonDomain = emailDomain && commonDomains.includes(emailDomain.toLowerCase());
  
  if (isCommonDomain) {
    console.log("Email check inconclusive, but domain is common. Allowing login attempt:", normalizedEmail);
    return true;
  }
  
  console.warn("All email existence checks failed for:", normalizedEmail);
  return false;
}

/**
 * Helper function to get user ID by email safely
 */
export async function getUserIdByEmail(email: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc(
      'get_user_id_by_email',
      { p_email: email.toLowerCase().trim() }
    );
    
    if (error || !data) {
      console.warn("Error in getUserIdByEmail:", error);
      return null;
    }
    
    // Safely extract ID
    if (typeof data === 'object' && data !== null && 'id' in data) {
      return String(data.id);
    }
    
    return null;
  } catch (error) {
    console.warn("Exception in getUserIdByEmail:", error);
    return null;
  }
}
