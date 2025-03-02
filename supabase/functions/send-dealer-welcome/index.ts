
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface EmailRequest {
  email: string;
  name: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the request payload
    const requestData = await req.json();
    const { email, name } = requestData as EmailRequest;

    if (!email) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Email is required"
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    console.log(`Sending welcome email to: ${email}, name: ${name || 'Dealer'}`);

    // Send welcome email
    const emailResponse = await resend.emails.send({
      from: "Auto-Strada <notifications@auto-strada.com>",
      to: [email],
      subject: "Welcome to Auto-Strada Dealer Portal",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #DC143C; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Welcome to Auto-Strada</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #e0e0e0; border-top: none;">
            <p>Hello ${name || 'Dealer'},</p>
            <p>Thank you for registering with Auto-Strada's Dealer Portal. Your account has been created successfully!</p>
            <p>Your dealer profile is currently under review by our team. We'll notify you once your verification is complete and you can start using all dealer features.</p>
            <p>In the meantime, you can log in to your account to explore the portal and update your profile.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${Deno.env.get("PUBLIC_SITE_URL") || ""}/auth" style="background-color: #DC143C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Sign In to Your Account</a>
            </div>
            <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
            <p>Best regards,<br>The Auto-Strada Team</p>
          </div>
          <div style="text-align: center; padding: 10px; color: #666; font-size: 12px;">
            <p>&copy; 2023 Auto-Strada. All rights reserved.</p>
          </div>
        </div>
      `,
    });

    console.log("Email sending result:", emailResponse);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          message: "Welcome email sent",
          id: emailResponse.id
        }
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Error sending welcome email:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error sending welcome email"
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
};

// Start the server
serve(handler);
