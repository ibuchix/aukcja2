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

    // Handle magiclink (Magic Link) emails
    if (type === "magiclink") {
      return new Response(
        JSON.stringify({
          subject: "Your Secure Login Link for Auto Market",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #DC143C;">Auto Market Secure Login</h1>
              
              <p style="margin: 20px 0; font-size: 16px;">Click the button below to securely log in to your Auto Market dealer account:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.confirmationURL}" 
                   style="display: inline-block; background-color: #DC143C; color: white; padding: 14px 28px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px;">
                  Log in to Auto Market
                </a>
              </div>
              
              <div style="background-color: #ECF1F4; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin-top: 0;"><strong>Security Note:</strong></p>
                <ul style="margin-bottom: 0;">
                  <li>This link will expire in 10 minutes</li>
                  <li>If you didn't request this login link, you can safely ignore this email</li>
                  <li>For security reasons, never share this link with anyone</li>
                </ul>
              </div>
              
              <p style="color: #6A6A77; font-size: 14px;">If the button doesn't work, you can copy and paste this URL into your browser:</p>
              <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 4px; font-size: 14px; color: #333333;">
                ${data.confirmationURL}
              </p>
              
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
