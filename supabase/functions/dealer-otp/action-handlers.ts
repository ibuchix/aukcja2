
import { SupabaseClient } from "@supabase/supabase-js";
import { validateEmail, validateOtp } from "./validation.ts";
import { verifyUserExists, getUserByEmail } from "./user-verification.ts";
import { storeOtp, verifyOtp, deleteOtp } from "./otp-management.ts";
import { sendOtpEmail } from "./email-service.ts";
import { createUserSession, getDealerProfile } from "./session-management.ts";

/**
 * Handles OTP generation action
 */
export async function handleGenerateOtp(supabase: SupabaseClient, email: string) {
  const normalizedEmail = validateEmail(email);
  
  // Verify user exists
  await verifyUserExists(supabase, normalizedEmail);
  
  // Generate and store OTP
  const otp = await storeOtp(supabase, normalizedEmail);
  
  // Send OTP email
  await sendOtpEmail(normalizedEmail, otp);
  
  return {
    success: true,
    message: "Login code sent successfully"
  };
}

/**
 * Handles OTP verification action
 */
export async function handleVerifyOtp(supabase: SupabaseClient, email: string, otp: string) {
  const normalizedEmail = validateEmail(email);
  const validatedOtp = validateOtp(otp);
  
  // Verify OTP
  await verifyOtp(supabase, normalizedEmail, validatedOtp);
  
  // Get user information
  const userData = await getUserByEmail(supabase, normalizedEmail);
  
  // Create a new session
  const sessionData = await createUserSession(supabase, userData.id);
  
  // Get dealer profile information
  const dealerData = await getDealerProfile(supabase, userData.id);
  
  // Delete the used OTP
  await deleteOtp(supabase, normalizedEmail);
  
  return {
    success: true,
    session: sessionData,
    dealer: dealerData || null
  };
}
