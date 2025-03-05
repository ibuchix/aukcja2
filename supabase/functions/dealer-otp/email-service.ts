
import { HttpError } from "../_shared/error-handling.ts";
import { OTP_EXPIRY_MINUTES } from "./otp-management.ts";

/**
 * Sends an OTP email to the user
 */
export async function sendOtpEmail(email: string, otp: string): Promise<void> {
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
