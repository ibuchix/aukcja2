
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resendApiKey = Deno.env.get("RESEND_API_KEY");
if (!resendApiKey) {
  console.error("Missing RESEND_API_KEY environment variable");
}

const resend = new Resend(resendApiKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface DealerWelcomeEmailRequest {
  name: string;
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Received dealer welcome email request");
    const { name, email }: DealerWelcomeEmailRequest = await req.json();

    if (!name || !email) {
      console.error("Missing required fields in request", { name, email });
      return new Response(
        JSON.stringify({ error: "Name and email are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`Sending welcome email to ${name} (${email})`);

    // Use a verified domain if available, or use the Resend test email for development
    // When in production, this should be changed to your verified domain
    const fromEmail = "onboarding@resend.dev";
    const fromName = "Auto Auction";

    const emailResponse = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: [email],
      subject: "Welcome to Auto Auction - Dealer Registration",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <h1 style="color: #DC143C; border-bottom: 2px solid #DC143C; padding-bottom: 10px;">Welcome to Auto Auction!</h1>
          
          <p><strong>Hello ${name},</strong></p>
          
          <p>Thank you for registering as a dealer on our Auto Auction platform. We're excited to have you join our community of automotive professionals!</p>
          
          <h2 style="color: #444; margin-top: 25px;">What's Next?</h2>
          
          <ol style="line-height: 1.6;">
            <li><strong>Verify your account</strong> - We'll review your dealer information within 1-2 business days.</li>
            <li><strong>Complete your profile</strong> - Add additional details about your dealership.</li>
            <li><strong>Browse available auctions</strong> - Start exploring vehicles that match your inventory needs.</li>
          </ol>
          
          <div style="background-color: #f8f8f8; border-left: 4px solid #DC143C; padding: 15px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Note:</strong> If you have any questions or need assistance, please contact our dealer support team at <a href="mailto:support@autoauction.com">support@autoauction.com</a> or call us at (555) 123-4567.</p>
          </div>
          
          <p>We look forward to helping you grow your business!</p>
          
          <p>Best regards,<br>The Auto Auction Team</p>
          
          <div style="border-top: 1px solid #ddd; margin-top: 30px; padding-top: 15px; font-size: 12px; color: #777;">
            <p>This email was sent to ${email}. If you did not register for an Auto Auction dealer account, please disregard this email.</p>
          </div>
        </div>
      `,
    });

    if (emailResponse.error) {
      console.error("Email sending error:", emailResponse.error);
      
      // Return more detailed error information for debugging
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: emailResponse.error,
          message: "Failed to send email. If using Resend in test mode, make sure to use your verified email as recipient or verify a domain."
        }),
        {
          status: 200, // Still return 200 to not fail registration process
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    console.error("Error sending dealer welcome email:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Failed to send email",
        message: "An unexpected error occurred while sending the welcome email."
      }),
      {
        status: 200, // Still return 200 to not fail registration process
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
