
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "@supabase/supabase-js";
import { createServiceClient } from "../_shared/supabase-client.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { HttpError, ValidationError, NotFoundError, handleError, withErrorHandling } from "../_shared/error-handling.ts";

// Constants
const OTP_EXPIRY_MINUTES = 15;
const OTP_LENGTH = 6;

/**
 * Validates email format and presence
 */
function validateEmail(email: string | null | undefined): string {
  if (!email || typeof email !== 'string') {
    throw new ValidationError("Email is required");
  }
  
  // Normalize and return the validated email
  return email.trim().toLowerCase();
}

/**
 * Validates OTP format and length
 */
function validateOtp(otp: string | null | undefined): string {
  if (!otp || typeof otp !== 'string' || otp.length !== OTP_LENGTH) {
    throw new ValidationError("Invalid verification code");
  }
  
  return otp;
}

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
 * Verifies if a user exists by email
 */
async function verifyUserExists(supabase: any, email: string) {
  console.log(`Verifying user exists with email: ${email}`);
  
  const { data: userData, error: userError } = await supabase
    .from('auth.users')
    .select('id')
    .eq('email', email)
    .maybeSingle();
  
  if (userError) {
    console.error("Error querying auth.users table:", userError);
    throw new HttpError("Failed to verify email address", 500);
  }
  
  if (!userData) {
    console.log("User not found for email:", email);
    throw new NotFoundError("Invalid email address");
  }
  
  console.log("User found with ID:", userData.id);
  return userData;
}

/**
 * Stores an OTP for a user
 */
async function storeOtp(supabase: any, email: string): Promise<string> {
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
 * Sends an OTP email to the user
 */
async function sendOtpEmail(email: string, otp: string): Promise<void> {
  console.log(`Sending OTP email to ${email}`);
  
  const emailResponse = await fetch(
    `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
      },
      body: JSON.stringify({
        to: email,
        subject: "Your Auto-Strada Login Code",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #DC143C;">Auto-Strada Login Code</h2>
            <p>Your one-time login code is:</p>
            <div style="font-size: 24px; font-weight: bold; letter-spacing: 5px; background-color: #f4f4f4; padding: 15px; text-align: center; margin: 20px 0;">
              ${otp}
            </div>
            <p>This code will expire in ${OTP_EXPIRY_MINUTES} minutes.</p>
            <p>If you didn't request this code, please ignore this email.</p>
            <p>Thank you,<br>The Auto-Strada Team</p>
          </div>
        `
      })
    }
  );
  
  if (!emailResponse.ok) {
    const errorText = await emailResponse.text();
    console.error("Error sending email:", errorText);
    throw new HttpError("Failed to send login code", 500);
  }
  
  console.log("OTP email sent successfully");
}

/**
 * Verifies an OTP for a given email
 */
async function verifyOtp(supabase: any, email: string, otp: string) {
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
 * Gets user information by email
 */
async function getUserByEmail(supabase: any, email: string) {
  console.log(`Getting user information for ${email}`);
  
  const { data: userData, error: userError } = await supabase
    .from('auth.users')
    .select('id')
    .eq('email', email)
    .single();
  
  if (userError || !userData) {
    console.error("User fetch failed:", userError || "User not found");
    throw new HttpError("Failed to authenticate user", 500);
  }
  
  console.log("Found user with ID:", userData.id);
  return userData;
}

/**
 * Creates a session for a user
 */
async function createUserSession(supabase: any, userId: string) {
  console.log(`Creating session for user ${userId}`);
  
  const { data: sessionData, error: sessionError } = await supabase.auth.admin.createSession({
    user_id: userId,
    expires_in: 60 * 60 * 24 * 7 // 1 week
  });
  
  if (sessionError || !sessionData) {
    console.error("Session creation failed:", sessionError);
    throw new HttpError("Failed to create user session", 500);
  }
  
  console.log("Session created successfully");
  return sessionData;
}

/**
 * Gets dealer profile information
 */
async function getDealerProfile(supabase: any, userId: string) {
  console.log(`Getting dealer profile for user ${userId}`);
  
  const { data: dealerData, error: dealerError } = await supabase
    .from('dealers')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  // Don't throw error if dealer profile not found, just return null
  if (dealerError) {
    console.log("Dealer profile not found or error:", dealerError);
    return null;
  }
  
  return dealerData;
}

/**
 * Deletes a used OTP
 */
async function deleteOtp(supabase: any, email: string) {
  console.log(`Deleting used OTP for ${email}`);
  
  await supabase
    .from('dealer_otps')
    .delete()
    .eq('email', email);
}

/**
 * Handles OTP generation action
 */
async function handleGenerateOtp(supabase: any, email: string) {
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
async function handleVerifyOtp(supabase: any, email: string, otp: string) {
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

/**
 * Main request handler
 */
const handleRequest = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  // Create Supabase client
  const supabase = createServiceClient();
  
  // Parse request body
  const { action, email, otp } = await req.json();
  
  // Process different actions
  if (action === 'generate') {
    return await withErrorHandling(
      () => handleGenerateOtp(supabase, email),
      { action: 'generate', email }
    );
  } 
  else if (action === 'verify') {
    return await withErrorHandling(
      () => handleVerifyOtp(supabase, email, otp),
      { action: 'verify', email }
    );
  }
  
  // Invalid action
  return new Response(
    JSON.stringify({ 
      success: false, 
      error: "Invalid action" 
    }),
    { 
      status: 400, 
      headers: { "Content-Type": "application/json", ...corsHeaders } 
    }
  );
};

// Start the server
serve(handleRequest);
