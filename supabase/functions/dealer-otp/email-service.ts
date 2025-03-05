
import { HttpError } from "../_shared/error-handling.ts";
import { OTP_EXPIRY_MINUTES } from "./otp-management.ts";
import { executeWithRetry } from "../_shared/retry-utils.ts";

/**
 * Sends an OTP email to the user
 */
export async function sendOtpEmail(email: string, otp: string): Promise<void> {
  console.log(`Sending OTP email to ${email}`);
  
  try {
    // Make sure environment variables are available
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing environment variables for email sending:',  {
        urlPresent: !!supabaseUrl,
        keyPresent: !!supabaseAnonKey
      });
      throw new HttpError("Server configuration error - email service", 500);
    }
    
    console.log(`Calling email service at ${supabaseUrl}/functions/v1/send-email`);
    
    // Use retry logic for email sending
    const sendEmailWithRetry = async () => {
      const emailResponse = await fetch(
        `${supabaseUrl}/functions/v1/send-email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseAnonKey}`
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
            `,
            from: "Auto-Strada <welcome@auto-strada.pl>" // Use verified domain
          })
        }
      );
      
      if (!emailResponse.ok) {
        const errorResponse = await emailResponse.json().catch(() => null);
        console.error("Error sending email:", errorResponse || await emailResponse.text());
        throw new HttpError(`Failed to send login code: ${errorResponse?.error || emailResponse.statusText}`, 500);
      }
      
      const responseData = await emailResponse.json();
      console.log("OTP email sent successfully. Response:", responseData);
      return responseData;
    };
    
    // Execute with retry logic
    await executeWithRetry(sendEmailWithRetry, {
      maxRetries: 3,
      baseDelay: 1000,
      shouldRetry: (error) => {
        // Retry on network errors and some 5xx server errors
        return error instanceof HttpError && 
               (error.message.includes('network') || 
                error.message.includes('timeout') ||
                error.status === 503 ||
                error.status === 502 ||
                error.status === 500);
      }
    });
    
  } catch (error) {
    console.error("Exception in sendOtpEmail:", error);
    if (error instanceof HttpError) {
      throw error;
    }
    throw new HttpError("Failed to send login code", 500);
  }
}
