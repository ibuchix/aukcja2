
import { ValidationError } from "../_shared/error-handling.ts";

// Constants
const OTP_LENGTH = 6;

/**
 * Validates email format and presence
 */
export function validateEmail(email: string | null | undefined): string {
  if (!email || typeof email !== 'string') {
    throw new ValidationError("Email is required");
  }
  
  // Normalize and return the validated email
  return email.trim().toLowerCase();
}

/**
 * Validates OTP format and length
 */
export function validateOtp(otp: string | null | undefined): string {
  if (!otp || typeof otp !== 'string' || otp.length !== OTP_LENGTH) {
    throw new ValidationError("Invalid verification code");
  }
  
  return otp;
}

export { OTP_LENGTH };
