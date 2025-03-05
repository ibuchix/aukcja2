
import { HttpError, ValidationError } from "../_shared/error-handling.ts";
import { SupabaseClient } from "@supabase/supabase-js";
import { OTP_LENGTH } from "./validation.ts";

const OTP_EXPIRY_MINUTES = 15;

/**
 * Generates a numeric OTP of specified length
 */
function generateOTP(length = OTP_LENGTH): string {
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10).toString();
  }
  return otp;
}

/**
 * Stores an OTP for a user
 */
export async function storeOtp(supabase: SupabaseClient, email: string): Promise<string> {
  const otp = generateOTP();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRY_MINUTES);
  
  console.log(`Storing OTP for ${email}, expires at ${expiresAt.toISOString()}`);
  
  const { error: insertError } = await supabase
    .from('dealer_otps')
    .upsert({
      email: email,
      otp_code: otp,
      expires_at: expiresAt.toISOString(),
      created_at: new Date().toISOString()
    }, { onConflict: 'email' });
  
  if (insertError) {
    console.error("Error saving OTP:", insertError);
    throw new HttpError("Failed to generate login code", 500);
  }
  
  return otp;
}

/**
 * Verifies an OTP for a given email
 */
export async function verifyOtp(supabase: SupabaseClient, email: string, otp: string) {
  console.log(`Verifying OTP for ${email}`);
  
  const { data: otpData, error: otpError } = await supabase
    .from('dealer_otps')
    .select('*')
    .eq('email', email)
    .eq('otp_code', otp)
    .gt('expires_at', new Date().toISOString())
    .single();
  
  if (otpError || !otpData) {
    console.error("OTP verification failed:", otpError || "Invalid or expired OTP");
    throw new ValidationError("Invalid or expired verification code");
  }
  
  console.log("OTP verified successfully");
  return otpData;
}

/**
 * Deletes a used OTP
 */
export async function deleteOtp(supabase: SupabaseClient, email: string) {
  console.log(`Deleting used OTP for ${email}`);
  
  await supabase
    .from('dealer_otps')
    .delete()
    .eq('email', email);
}

export { OTP_EXPIRY_MINUTES };
