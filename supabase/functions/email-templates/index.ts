import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, email, data } = await req.json();

    if (type === "signup") {
      return new Response(
        JSON.stringify({
          subject: "Welcome to Auto Market - Account Verification Required",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #DC143C;">Welcome to Auto Market!</h1>
              <p>Dear ${data.name},</p>
              <p>Thank you for registering as a dealer on Auto Market. Before you can start using your account, there are two important steps:</p>
              
              <div style="background-color: #EFEFFD; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h2 style="color: #DC143C; margin-top: 0;">Next Steps:</h2>
                <ol style="margin: 0; padding-left: 20px;">
                  <li style="margin-bottom: 10px;"><strong>Email Verification:</strong> Please verify your email address by clicking the button below.</li>
                  <li><strong>Account Review:</strong> Your dealer account is currently under review by our team. We'll notify you once your account has been verified.</li>
                </ol>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.confirmationUrl}" 
                   style="display: inline-block; background-color: #DC143C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                  Verify Email Address
                </a>
              </div>

              <div style="background-color: #ECF1F4; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #383B39; margin-top: 0;">What happens next?</h3>
                <p style="margin-bottom: 0;">After verifying your email:</p>
                <ul style="margin-top: 10px;">
                  <li>Our team will review your dealer application</li>
                  <li>You'll receive another email once your account is verified</li>
                  <li>Once verified, you'll have full access to the Auto Market dealer platform</li>
                </ul>
              </div>

              <p>If you have any questions during this process, please contact our support team.</p>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ECF1F4;">
                <p style="color: #6A6A77; font-size: 14px;">Best regards,<br>The Auto Market Team</p>
              </div>
            </div>
          `,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    return new Response(
      JSON.stringify({ error: "Unsupported email type" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
};

serve(handler);