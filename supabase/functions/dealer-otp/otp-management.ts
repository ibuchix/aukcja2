
import { HttpError, ValidationError } from "../_shared/error-handling.ts";
import { SupabaseClient } from "@supabase/supabase-js";
import { OTP_LENGTH } from "./validation.ts";

export const OTP_EXPIRY_MINUTES = 15;
const MAX_OTP_ATTEMPTS = 5; // Maximum attempts before rate limiting

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
  
  try {
    // Use direct SQL insert with the store_dealer_otp function to avoid RLS issues
    const { data: otpId, error: storeError } = await supabase
      .rpc('store_dealer_otp', {
        p_email: email,
        p_otp: otp,
        p_expires_at: expiresAt.toISOString()
      });
    
    if (storeError) {
      console.error("Error saving OTP:", storeError);
      throw new HttpError(`Failed to generate login code: ${storeError.message}`, 500);
    }
    
    console.log("OTP stored successfully with ID:", otpId);
    return otp;
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    console.error("Exception in storeOtp:", error);
    throw new HttpError("Failed to generate login code", 500);
  }
}

/**
 * Verifies an OTP for a given email
 */
export async function verifyOtp(supabase: SupabaseClient, email: string, otp: string) {
  console.log(`Verifying OTP for ${email}`);
  
  try {
    // First check if user is rate limited due to too many attempts
    // Use a direct query with "select" instead of ".single()" to better handle errors
    const { data: otpRecords, error: fetchError } = await supabase
      .from('dealer_otps')
      .select('*')
      .eq('email', email);
    
    if (fetchError) {
      console.error("Error fetching OTP record:", fetchError);
      
      // Check specifically for permission errors
      if (fetchError.code === '42501') {
        throw new HttpError("Database permission denied. Please contact support.", 500);
      }
      
      // For other errors, use a generic message
      throw new ValidationError("Could not verify code. Please try again.");
    }
    
    if (!otpRecords || otpRecords.length === 0) {
      console.log("No OTP record found for email:", email);
      throw new ValidationError("Invalid or expired verification code");
    }
    
    const otpData = otpRecords[0];
    
    // If there's a record and attempts exceeds the limit, reject
    if (otpData && otpData.attempts >= MAX_OTP_ATTEMPTS) {
      console.error("Too many failed attempts for email:", email);
      throw new ValidationError("Too many failed attempts. Please request a new code.");
    }
    
    // Now try to verify the OTP
    const currentTime = new Date().toISOString();
    const isValid = 
      otpData.otp_code === otp && 
      otpData.expires_at > currentTime;
    
    if (!isValid) {
      console.error("OTP verification failed: code mismatch or expired");
      
      // Increment the attempts counter
      const { error: updateError } = await supabase
        .from('dealer_otps')
        .update({ attempts: (otpData.attempts || 0) + 1 })
        .eq('email', email);
      
      if (updateError) {
        console.error("Error updating attempts counter:", updateError);
      }
      
      throw new ValidationError("Invalid or expired verification code");
    }
    
    console.log("OTP verified successfully");
    return otpData;
  } catch (error) {
    if (error instanceof ValidationError || error instanceof HttpError) {
      throw error;
    }
    console.error("Exception in verifyOtp:", error);
    throw new ValidationError("Invalid or expired verification code");
  }
}

/**
 * Deletes a used OTP
 */
export async function deleteOtp(supabase: SupabaseClient, email: string) {
  console.log(`Deleting used OTP for ${email}`);
  
  try {
    const { error } = await supabase
      .from('dealer_otps')
      .delete()
      .eq('email', email);
    
    if (error) {
      console.error("Error deleting OTP:", error);
      // Log but don't throw - this is cleanup
    } else {
      console.log("OTP deleted successfully");
    }
  } catch (error) {
    console.error("Exception deleting OTP:", error);
    // Don't throw here - just log the error since this is cleanup
  }
}
