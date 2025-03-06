
import { SupabaseClient } from "@supabase/supabase-js";
import { validateEmail, validateOtp } from "./validation.ts";
import { verifyUserExists, getUserByEmail } from "./user-verification.ts";
import { storeOtp, verifyOtp, deleteOtp } from "./otp-management.ts";
import { sendOtpEmail } from "./email-service.ts";
import { generateExchangeToken, getDealerProfile } from "./session-management.ts";
import { corsHeaders } from "../_shared/cors.ts";

/**
 * Handles OTP generation action
 */
export async function handleGenerateOtp(supabase: SupabaseClient, email: string) {
  console.log(`[dealer-otp] Generating OTP for email: ${email?.substring(0, 3)}...`);
  
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
  console.log(`[dealer-otp] Verifying OTP for email: ${email?.substring(0, 3)}...`);
  
  const normalizedEmail = validateEmail(email);
  const validatedOtp = validateOtp(otp);
  
  // Verify OTP
  await verifyOtp(supabase, normalizedEmail, validatedOtp);
  
  // Get user information
  const userData = await getUserByEmail(supabase, normalizedEmail);
  
  // Generate auth tokens for client-side session creation
  const tokens = await generateExchangeToken(userData.id, normalizedEmail);
  
  // Get dealer profile information
  const dealerData = await getDealerProfile(supabase, userData.id);
  
  // Delete the used OTP
  await deleteOtp(supabase, normalizedEmail);
  
  const response = {
    success: true,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    user: {
      id: userData.id,
      email: normalizedEmail
    },
    dealer: dealerData || null
  };
  
  // If dealer profile needs completion, include specific flag for client handling
  if (dealerData && dealerData.needsProfileCompletion) {
    response.profileStatus = 'incomplete';
    response.completionRequired = true;
  }
  
  return response;
}
