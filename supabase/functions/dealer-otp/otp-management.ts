
import { HttpError, ValidationError } from "../_shared/error-handling.ts";
import { SupabaseClient } from "@supabase/supabase-js";
import { OTP_LENGTH } from "./validation.ts";

export const OTP_EXPIRY_MINUTES = 15;

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
    // Use the secure RPC function with SECURITY DEFINER to store the OTP
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
    const { data: otpData, error: otpError } = await supabase
      .from('dealer_otps')
      .select('*')
      .eq('email', email)
      .eq('otp_code', otp)
      .gt('expires_at', new Date().toISOString())
      .single();
    
    if (otpError) {
      console.error("OTP verification failed:", otpError);
      throw new ValidationError("Invalid or expired verification code");
    }
    
    if (!otpData) {
      console.error("OTP verification failed: No matching OTP found");
      throw new ValidationError("Invalid or expired verification code");
    }
    
    console.log("OTP verified successfully");
    return otpData;
  } catch (error) {
    if (error instanceof ValidationError) {
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
