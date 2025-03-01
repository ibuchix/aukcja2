
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
