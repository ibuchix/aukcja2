
import { supabase } from "@/integrations/supabase/client";

// Shared validation utilities for authentication
export const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  if (!email) {
    return { isValid: false, error: "Email is required" };
  }
  
  const trimmedEmail = email.trim();
  if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
    return { isValid: false, error: "Invalid email format" };
  }
  return { isValid: true };
};

export const validatePassword = (password: string): { isValid: boolean; error?: string } => {
  if (!password) {
    return { isValid: false, error: "Password is required" };
  }
  
  if (password.length < 8) {
    return { isValid: false, error: "Password must be at least 8 characters" };
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: "Password must contain at least one uppercase letter" };
  }
  if (!/[a-z]/.test(password)) {
    return { isValid: false, error: "Password must contain at least one lowercase letter" };
  }
  if (!/[0-9]/.test(password)) {
    return { isValid: false, error: "Password must contain at least one number" };
  }
  return { isValid: true };
};

// Helper function to safely trim strings (handles null/undefined)
export const safeTrim = (value: string | null | undefined): string => {
  if (!value) return '';
  return value.trim();
};

// Updated to check for dealer role specifically during registration
export const checkAccountExists = async (email: string, isRegistration: boolean = true): Promise<boolean> => {
  if (!email || !email.trim()) {
    console.warn("Empty email provided to checkAccountExists");
    return false;
  }

  const normalizedEmail = email.trim().toLowerCase();
  console.log(`Checking if account exists with email: ${normalizedEmail}, isRegistration: ${isRegistration}`);
  
  try {
    // For dealer registration, use the correct RPC function
    if (isRegistration) {
      const { data, error } = await fetch(`https://sdvakfhmoaoucmhbhwvy.supabase.co/functions/v1/dealer-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkdmFrZmhtb2FvdWNtaGJod3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ3OTI1OTEsImV4cCI6MjA1MDM2ODU5MX0.wvvxbqF3Hg_fmQ_4aJCqISQvcFXhm-2BngjvO6EHL0M',
        },
        body: JSON.stringify({
          action: 'check_dealer_email',
          email: normalizedEmail
        })
      }).then(res => res.json());

      if (error) {
        console.error("Error checking if email exists as dealer:", error);
        // Fall through to database function check
      } else if (data && typeof data === 'object') {
        // If we have a clear response about dealer existence
        if ('exists' in data) {
          console.log(`Email existence as dealer check result: ${data.exists}`);
          return !!data.exists;
        }
      }
      
      // Fallback to using check_email_exists function (corrected name)
      const { data: dbData, error: dbError } = await supabase.rpc(
        "check_email_exists",
        { email_to_check: normalizedEmail }
      );
      
      if (!dbError && dbData) {
        console.log("check_email_exists result:", dbData);
        // Handle different response formats from the RPC function
        if (typeof dbData === 'boolean') {
          return dbData;
        } else if (typeof dbData === 'object' && dbData !== null && 'exists' in dbData) {
          return !!dbData.exists;
        } else if (typeof dbData === 'number') {
          return dbData > 0;
        }
      }
    } else {
      // For login or other scenarios, use general email exists check
      const { data, error } = await fetch(`https://sdvakfhmoaoucmhbhwvy.supabase.co/auth/v1/user-exists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkdmFrZmhtb2FvdWNtaGJod3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ3OTI1OTEsImV4cCI6MjA1MDM2ODU5MX0.wvvxbqF3Hg_fmQ_4aJCqISQvcFXhm-2BngjvO6EHL0M',
        },
        body: JSON.stringify({ email: normalizedEmail })
      }).then(res => res.json());

      if (error) {
        console.error("Error checking if account exists:", error);
        // Fall through to next method
      } else if (data && typeof data === 'object') {
        // If we have a clear response about existence, return that
        if ('exists' in data) {
          console.log(`Email existence check result: ${data.exists}`);
          return !!data.exists;
        }
      }
    }

    // For login flows, we can be more lenient with common domains to prevent turning away legitimate users
    const emailDomain = normalizedEmail.split('@')[1];
    const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'];
    const isCommonDomain = emailDomain && commonDomains.includes(emailDomain.toLowerCase());
    
    if (!isRegistration && isCommonDomain) {
      console.log("Email check inconclusive for login, but domain is common. Allowing login attempt.");
      return false;
    }
    
    return false;
  } catch (err) {
    console.error("Failed to check if account exists:", err);
    return false;
  }
};
