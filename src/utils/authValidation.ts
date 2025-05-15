
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

export const checkAccountExists = async (email: string, isRegistration: boolean = true): Promise<boolean> => {
  if (!email || !email.trim()) {
    console.warn("Empty email provided to checkAccountExists");
    return false;
  }

  const normalizedEmail = email.trim().toLowerCase();
  console.log(`Checking if account exists with email: ${normalizedEmail}, isRegistration: ${isRegistration}`);
  
  try {
    // Direct API call to check if email exists - most reliable method
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

    // If the check doesn't conclusively say the email exists, and this is for registration,
    // we assume the email doesn't exist to allow registration to proceed
    if (isRegistration) {
      console.log("No conclusive result from existence check, assuming email is available for registration");
      return false;
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
