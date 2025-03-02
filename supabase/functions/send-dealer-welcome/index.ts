
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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
    const { name, email }: WelcomeEmailRequest = await req.json();

    console.log(`Sending welcome email to ${email} for ${name}`);

    if (!email || !name) {
      return new Response(
        JSON.stringify({ error: "Email and name are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const emailResponse = await resend.emails.send({
      from: "Auto-Strada <onboarding@resend.dev>",
      to: [email],
      subject: "Welcome to Auto-Strada Dealer Network!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #DC143C;">Welcome to Auto-Strada!</h1>
          <p>Hello ${name},</p>
          <p>Thank you for registering as a dealer with Auto-Strada. We're excited to have you join our network of trusted automotive dealers.</p>
          <p>Your account has been created successfully. You can now log in to your dealer dashboard to:</p>
          <ul>
            <li>Participate in vehicle auctions</li>
            <li>Manage your dealer profile</li>
            <li>Track your bids and purchases</li>
          </ul>
          <p>If you have any questions or need assistance, please don't hesitate to contact our dealer support team.</p>
          <p>Best regards,<br>The Auto-Strada Team</p>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-dealer-welcome function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
