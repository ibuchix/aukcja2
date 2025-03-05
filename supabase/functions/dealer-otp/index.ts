
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "@supabase/supabase-js";
import { createServiceClient } from "../_shared/supabase-client.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const OTP_EXPIRY_MINUTES = 15;
const OTP_LENGTH = 6;

// Generate a numeric OTP of specified length
function generateOTP(length = OTP_LENGTH) {
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10).toString();
  }
  return otp;
}

// Handler function for the edge function
const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const supabase = createServiceClient();
    const { action, email, otp } = await req.json();
    
    // Validate input
    if (!email || typeof email !== 'string') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Email is required" 
        }),
        { 
          status: 400, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }
    
    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();
    
    // Check if this is a request to generate a new OTP
    if (action === 'generate') {
      console.log(`Generating OTP for ${normalizedEmail}`);
      
      // Check if user exists
      const { data: userExists, error: userCheckError } = await supabase.rpc(
        'check_email_exists', 
        { p_email: normalizedEmail }
      );
      
      if (userCheckError || !userExists || !userExists.exists) {
        console.error("User check failed:", userCheckError || "User not found");
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Invalid email address" 
          }),
          { 
            status: 404, 
            headers: { "Content-Type": "application/json", ...corsHeaders } 
          }
        );
      }
      
      // Generate a new OTP
      const otp = generateOTP();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRY_MINUTES);
      
      // Save OTP to database
      const { error: insertError } = await supabase
        .from('dealer_otps')
        .upsert({
          email: normalizedEmail,
          otp_code: otp,
          expires_at: expiresAt.toISOString(),
          created_at: new Date().toISOString()
        }, { onConflict: 'email' });
      
      if (insertError) {
        console.error("Error saving OTP:", insertError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Failed to generate login code" 
          }),
          { 
            status: 500, 
            headers: { "Content-Type": "application/json", ...corsHeaders } 
          }
        );
      }
      
      // Send the OTP via email
      const emailResponse = await fetch(
        `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
          },
          body: JSON.stringify({
            to: normalizedEmail,
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
        console.error("Error sending email:", await emailResponse.text());
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Failed to send login code" 
          }),
          { 
            status: 500, 
            headers: { "Content-Type": "application/json", ...corsHeaders } 
          }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Login code sent successfully" 
        }),
        { 
          status: 200, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }
    
    // Check if this is a request to verify an OTP
    else if (action === 'verify') {
      if (!otp || typeof otp !== 'string' || otp.length !== OTP_LENGTH) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Invalid verification code" 
          }),
          { 
            status: 400, 
            headers: { "Content-Type": "application/json", ...corsHeaders } 
          }
        );
      }
      
      // Check if OTP exists and is valid
      const { data: otpData, error: otpError } = await supabase
        .from('dealer_otps')
        .select('*')
        .eq('email', normalizedEmail)
        .eq('otp_code', otp)
        .gt('expires_at', new Date().toISOString())
        .single();
      
      if (otpError || !otpData) {
        console.error("OTP verification failed:", otpError || "Invalid or expired OTP");
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Invalid or expired verification code" 
          }),
          { 
            status: 400, 
            headers: { "Content-Type": "application/json", ...corsHeaders } 
          }
        );
      }
      
      // Get user information
      const { data: userData, error: userError } = await supabase
        .from('auth.users')
        .select('id')
        .eq('email', normalizedEmail)
        .single();
      
      if (userError || !userData) {
        console.error("User fetch failed:", userError || "User not found");
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Failed to authenticate user" 
          }),
          { 
            status: 500, 
            headers: { "Content-Type": "application/json", ...corsHeaders } 
          }
        );
      }
      
      // Create a new session for the user
      const { data: sessionData, error: sessionError } = await supabase.auth.admin.createSession({
        user_id: userData.id,
        expires_in: 60 * 60 * 24 * 7 // 1 week
      });
      
      if (sessionError || !sessionData) {
        console.error("Session creation failed:", sessionError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Failed to create user session" 
          }),
          { 
            status: 500, 
            headers: { "Content-Type": "application/json", ...corsHeaders } 
          }
        );
      }
      
      // Get dealer profile information
      const { data: dealerData, error: dealerError } = await supabase
        .from('dealers')
        .select('*')
        .eq('user_id', userData.id)
        .single();
      
      // Delete the used OTP
      await supabase
        .from('dealer_otps')
        .delete()
        .eq('email', normalizedEmail);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          session: sessionData,
          dealer: dealerData || null
        }),
        { 
          status: 200, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }
    
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
    
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "An unexpected error occurred" 
      }),
      { 
        status: 500, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  }
};

serve(handler);
