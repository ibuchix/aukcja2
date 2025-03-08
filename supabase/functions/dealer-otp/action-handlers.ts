
import { SupabaseClient } from "@supabase/supabase-js";
import { validateEmail, validateOtp } from "./validation.ts";
import { verifyUserExists, getUserByEmail } from "./user-verification.ts";
import { storeOtp, verifyOtp, deleteOtp } from "./otp-management.ts";
import { sendOtpEmail } from "./email-service.ts";
import { generateExchangeToken, getDealerProfile } from "./session-management.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { ValidationError, NotFoundError } from "../_shared/error-handling.ts";

/**
 * Handles OTP generation action
 */
export async function handleGenerateOtp(supabase: SupabaseClient, email: string) {
  console.log(`[dealer-otp] Generating OTP for email: ${email?.substring(0, 3)}...`);
  
  try {
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
  } catch (error) {
    console.error(`[dealer-otp] Error generating OTP: ${error.message}`);
    
    // Rethrow the error to be handled by the withErrorHandling wrapper
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      throw error;
    }
    
    throw new Error(`Failed to generate login code: ${error.message}`);
  }
}

/**
 * Handles OTP verification action
 */
export async function handleVerifyOtp(supabase: SupabaseClient, email: string, otp: string) {
  console.log(`[dealer-otp] Verifying OTP for email: ${email?.substring(0, 3)}...`);
  
  try {
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
      exchangeToken: tokens.exchangeToken,
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
  } catch (error) {
    console.error(`[dealer-otp] Error verifying OTP: ${error.message}`);
    
    // Rethrow the error to be handled by the withErrorHandling wrapper
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      throw error;
    }
    
    throw new Error(`Failed to verify login code: ${error.message}`);
  }
}

/**
 * Handles checking if an email exists without sending OTP
 * This is a helper endpoint to validate emails before attempting login
 */
export async function handleCheckEmail(supabase: SupabaseClient, email: string) {
  console.log(`[dealer-otp] Checking if email exists: ${email?.substring(0, 3)}...`);
  
  try {
    const normalizedEmail = validateEmail(email);
    
    // Simple check in auth.users table via DB function
    const { data, error } = await supabase.rpc('check_email_exists', { 
      email_to_check: normalizedEmail 
    });
    
    if (error) {
      console.error("Error checking email:", error);
      throw new Error(`Failed to check email status: ${error.message}`);
    }
    
    // Parse the response based on various possible return formats
    let exists = false;
    
    if (data !== null) {
      if (typeof data === 'object' && 'exists' in data) {
        exists = Boolean(data.exists);
      } else if (typeof data === 'number') {
        exists = data > 0;
      } else if (typeof data === 'boolean') {
        exists = data;
      }
    }
    
    return {
      success: true,
      exists: exists
    };
  } catch (error) {
    console.error("Exception in handleCheckEmail:", error);
    
    // Rethrow the error to be handled by the withErrorHandling wrapper
    if (error instanceof ValidationError) {
      throw error;
    }
    
    throw new Error(`Failed to check email existence: ${error.message}`);
  }
}
