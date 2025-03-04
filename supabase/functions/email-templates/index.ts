
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailTemplateRequest {
  type: "signup" | "magiclink" | "invite" | "recovery";
  email: string;
  data: {
    confirmationURL?: string;
    token?: string;
    tokenHash?: string;
    siteURL?: string;
    redirectTo?: string;
    [key: string]: any;
  };
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, email, data }: EmailTemplateRequest = await req.json();

    // Handle signup confirmation emails
    if (type === "signup") {
      return new Response(
        JSON.stringify({
          subject: "Welcome to Auto Market - Please Confirm Your Email",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #DC143C;">Welcome to Auto Market!</h1>
              <p>Thank you for registering as a dealer on Auto Market. To get started, please confirm your email address:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.confirmationURL}" 
                   style="display: inline-block; background-color: #DC143C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                  Confirm Email Address
                </a>
              </div>

              <div style="background-color: #ECF1F4; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #383B39; margin-top: 0;">What happens next?</h3>
                <p>After confirming your email:</p>
                <ul>
                  <li>Our team will review your dealer application</li>
                  <li>You'll receive another email once your account is verified</li>
                  <li>Once verified, you'll have full access to the Auto Market dealer platform</li>
                </ul>
              </div>

              <p>If you didn't create this account, you can safely ignore this email.</p>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ECF1F4;">
                <p style="color: #6A6A77; font-size: 14px;">Best regards,<br>The Auto Market Team</p>
              </div>
            </div>
          `,
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Handle magiclink (OTP) emails
    if (type === "magiclink") {
      return new Response(
        JSON.stringify({
          subject: "Your Login Code for Auto Market",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #DC143C;">Auto Market Login</h1>
              
              <div style="background-color: #ECF1F4; padding: 30px; border-radius: 8px; margin: 20px 0; text-align: center;">
                <h2 style="color: #383B39; margin-top: 0;">Your verification code</h2>
                <div style="font-size: 36px; letter-spacing: 8px; font-weight: bold; margin: 30px 0; color: #DC143C;">
                  ${data.token}
                </div>
                <p style="color: #6A6A77;">This code will expire in 10 minutes</p>
              </div>
              
              <p>You can also click the button below to log in instantly:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.confirmationURL}" 
                   style="display: inline-block; background-color: #DC143C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                  Log in to Auto Market
                </a>
              </div>

              <p>If you didn't request this login code, you can safely ignore this email.</p>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ECF1F4;">
                <p style="color: #6A6A77; font-size: 14px;">Best regards,<br>The Auto Market Team</p>
              </div>
            </div>
          `,
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Return a default template for unhandled email types
    return new Response(
      JSON.stringify({
        subject: "Action Required",
        html: `<p>Please click the link below:</p><p><a href="${data.confirmationURL}">Complete Action</a></p>`,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to generate email template" }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 500,
      }
    );
  }
});
