
import { ValidationError } from "../_shared/error-handling.ts";

export const OTP_LENGTH = 6;

/**
 * Validates email format and returns normalized email
 */
export function validateEmail(email: string): string {
  if (!email) {
    throw new ValidationError("Email is required");
  }
  
  // Normalize email (trim whitespace, convert to lowercase)
  const normalizedEmail = email.trim().toLowerCase();
  
  // Simple regex for email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    throw new ValidationError("Invalid email format");
  }
  
  return normalizedEmail;
}

/**
 * Validates OTP format and returns normalized OTP
 */
export function validateOtp(otp: string): string {
  if (!otp) {
    throw new ValidationError("Verification code is required");
  }
  
  // Normalize OTP (remove whitespace)
  const normalizedOtp = otp.replace(/\s/g, '');
  
  // Validate OTP length
  if (normalizedOtp.length !== OTP_LENGTH) {
    throw new ValidationError(`Verification code must be ${OTP_LENGTH} digits`);
  }
  
  // Validate OTP contains only digits
  if (!/^\d+$/.test(normalizedOtp)) {
    throw new ValidationError("Verification code must contain only digits");
  }
  
  return normalizedOtp;
}
