import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  name: string;
  confirmationUrl: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting email sending process");
    
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not set");
      throw new Error("Email service configuration is missing");
    }

    const { to, name, confirmationUrl }: EmailRequest = await req.json();
    console.log("Received request to send email to:", to);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Auto Market <onboarding@resend.dev>",
        to: [to],
        subject: "Welcome to Auto Market - Account Verification Required",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #DC143C;">Welcome to Auto Market!</h1>
            <p>Dear ${name},</p>
            <p>Thank you for registering as a dealer on Auto Market. Before you can start using your account, there are two important steps:</p>
            
            <div style="background-color: #EFEFFD; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="color: #DC143C; margin-top: 0;">Next Steps:</h2>
              <ol style="margin: 0; padding-left: 20px;">
                <li style="margin-bottom: 10px;"><strong>Email Verification:</strong> Please verify your email address by clicking the button below.</li>
                <li><strong>Account Review:</strong> Your dealer account is currently under review by our team. We'll notify you once your account has been verified.</li>
              </ol>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${confirmationUrl}" 
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
    });

    const responseData = await res.json();
    console.log("Resend API response:", responseData);

    if (!res.ok) {
      console.error("Failed to send email:", responseData);
      throw new Error(responseData.message || "Failed to send email");
    }

    return new Response(JSON.stringify({ success: true, data: responseData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in send-dealer-welcome function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
};

serve(handler);