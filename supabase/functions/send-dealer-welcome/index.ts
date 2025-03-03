
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

// Initialize the Resend client with the API key
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// CORS headers for cross-origin requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Interface for the request body
interface WelcomeEmailRequest {
  name: string;
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { name, email }: WelcomeEmailRequest = await req.json();

    if (!name || !email) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields: name and email must be provided",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`Sending welcome email to ${name} (${email})`);

    // Use the verified domain for the from address
    const fromEmail = "welcome@auto-strada.pl";
    const fromName = "Auto Auction";

    // Get the application URL from environment variable or use a default
    const appUrl = Deno.env.get("APP_URL") || "https://auto-strada.pl";
    const dashboardUrl = `${appUrl}/dealer/dashboard`;

    const emailResponse = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: email,
      subject: "Welcome to Auto Auction - Your Dealer Registration is Complete",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <h1 style="color: #DC143C; margin-bottom: 20px;">Welcome to Auto Auction!</h1>
          
          <p>Dear ${name},</p>
          
          <p>Thank you for registering as a dealer with Auto Auction. Your account has been created and you're ready to start exploring our platform.</p>
          
          <p>Here's what you can do now:</p>
          
          <ol style="margin-bottom: 20px;">
            <li><strong>Browse available auctions</strong> - Find vehicles that match your inventory needs</li>
            <li><strong>Place bids</strong> - Participate in live auctions and secure vehicles for your dealership</li>
            <li><strong>Manage your profile</strong> - Update your business information and preferences</li>
            <li><strong>Track your activity</strong> - Monitor your bids, purchases, and transactions</li>
          </ol>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${dashboardUrl}" style="background-color: #DC143C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Go to Your Dashboard</a>
          </div>
          
          <div style="background-color: #f8f8f8; border-left: 4px solid #DC143C; padding: 15px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Note:</strong> If you have any questions or need assistance, please contact our dealer support team at <a href="mailto:support@auto-strada.pl">support@auto-strada.pl</a> or call us at (555) 123-4567.</p>
          </div>
          
          <p>We look forward to helping you grow your business!</p>
          
          <p>Best regards,<br>The Auto Auction Team</p>
        </div>
      `,
    });

    console.log("Email sending response:", emailResponse);

    // Handle email sending response
    if (emailResponse.error) {
      console.error("Email sending error:", emailResponse.error);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: emailResponse.error,
          message: "Failed to send email. Please contact support if this issue persists."
        }),
        {
          status: 200, // Still return 200 to not fail registration process
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, id: emailResponse.data?.id }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error) {
    console.error("Error in send-dealer-welcome function:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
