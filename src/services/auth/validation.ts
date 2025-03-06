
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
 * Uses Supabase auth directly to avoid signup errors
 */
export async function checkAccountExists(email: string): Promise<boolean> {
  try {
    console.log("Checking if account exists with email:", email);
    
    // Corrected: Use the listUsers method with the correct parameter structure
    // The Supabase JS library expects 'page' and 'perPage' as the PageParams
    const { data, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.warn("Error checking user with Supabase Auth API:", error);
      
      // Try fallback method using database function
      return await checkAccountExistsWithDbFunctions(email);
    }
    
    // If we received users data, search for the email in the list
    if (data?.users) {
      const userExists = data.users.some(user => 
        user.email && user.email.toLowerCase() === email.toLowerCase()
      );
      
      if (userExists) {
        console.log("User exists according to Supabase Auth API");
        return true;
      }
    }
    
    // If no user data but also no error, the user doesn't exist
    console.log("User doesn't exist according to Supabase Auth API");
    return false;
  } catch (error) {
    console.error("Unhandled error checking if account exists:", error);
    
    // Try fallback method using database function
    return await checkAccountExistsWithDbFunctions(email);
  }
}

/**
 * Fallback method to check if account exists using database functions
 */
async function checkAccountExistsWithDbFunctions(email: string): Promise<boolean> {
  try {
    // Method 1: Use check_email_exists RPC function
    const { data: emailData, error: emailError } = await supabase.rpc(
      'check_email_exists', 
      { email_to_check: email.toLowerCase().trim() }
    );
    
    if (!emailError && emailData !== null) {
      console.log("check_email_exists result:", emailData);
      
      // Handle different possible return types from the function
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
    }
    
    // Method 2: Try with get_user_id_by_email function
    const { data: userData, error: userError } = await supabase.rpc(
      'get_user_id_by_email',
      { p_email: email.toLowerCase().trim() }
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
    
    // If all checks failed, default to false
    console.warn("All email existence checks failed, assuming email doesn't exist");
    return false;
    
  } catch (error) {
    console.error("Error in checkAccountExistsWithDbFunctions:", error);
    return false;
  }
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

