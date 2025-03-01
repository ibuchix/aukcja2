
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

export const checkAccountExists = async (email: string): Promise<boolean> => {
  try {
    const { data, error } = await fetch(`https://sdvakfhmoaoucmhbhwvy.supabase.co/auth/v1/user-exists`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkdmFrZmhtb2FvdWNtaGJod3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ3OTI1OTEsImV4cCI6MjA1MDM2ODU5MX0.wvvxbqF3Hg_fmQ_4aJCqISQvcFXhm-2BngjvO6EHL0M',
      },
      body: JSON.stringify({ email })
    }).then(res => res.json());

    if (error) {
      console.error("Error checking if account exists:", error);
      return false;
    }

    return !!data?.exists;
  } catch (err) {
    console.error("Failed to check if account exists:", err);
    return false;
  }
};
