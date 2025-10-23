import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetEmailRequest {
  email: string;
  token: string;
  dealershipName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, token, dealershipName }: PasswordResetEmailRequest = await req.json();

    if (!email || !token) {
      return new Response(
        JSON.stringify({ error: "Email and token are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const resetUrl = `${Deno.env.get("APP_URL") || "http://localhost:8080"}/password-reset?token=${token}`;

    const emailResponse = await resend.emails.send({
      from: "Auto Trader <powiadomienia@autaro.pl>",
      to: [email],
      subject: "Reset Your Password",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="background-color: #D81B24; padding: 30px; text-align: center;">
                      <h1 style="color: #FCFCFC; margin: 0; font-size: 24px;">Password Reset Request</h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <p style="color: #454545; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                        Hello ${dealershipName},
                      </p>
                      
                      <p style="color: #454545; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                        We received a request to reset your password. Click the button below to create a new password:
                      </p>
                      
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                        <tr>
                          <td align="center">
                            <a href="${resetUrl}" style="display: inline-block; background-color: #D81B24; color: #FCFCFC; text-decoration: none; padding: 14px 40px; border-radius: 4px; font-size: 16px; font-weight: bold;">
                              Reset Password
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="color: #454545; font-size: 14px; line-height: 1.6; margin: 20px 0 0;">
                        Or copy and paste this link into your browser:
                      </p>
                      <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 10px 0 20px; word-break: break-all;">
                        ${resetUrl}
                      </p>
                      
                      <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
                        <p style="color: #856404; font-size: 14px; margin: 0; line-height: 1.6;">
                          <strong>⚠️ Important:</strong> This link will expire in 1 hour. If you didn't request this password reset, please ignore this email.
                        </p>
                      </div>
                      
                      <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 20px 0 0;">
                        Best regards,<br>
                        The Auto Trader Team
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center;">
                      <p style="color: #666; font-size: 12px; margin: 0; line-height: 1.6;">
                        This is an automated message, please do not reply to this email.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    console.log("Password reset email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending password reset email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
