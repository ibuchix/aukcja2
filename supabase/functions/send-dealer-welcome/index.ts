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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, name, confirmationUrl }: EmailRequest = await req.json();

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Auto Market <onboarding@resend.dev>",
        to: [to],
        subject: "Welcome to Auto Market - Please Confirm Your Email",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #DC143C;">Welcome to Auto Market!</h1>
            <p>Dear ${name},</p>
            <p>Thank you for registering as a dealer on Auto Market. Your application has been received and is currently under review.</p>
            <p>Please confirm your email address by clicking the button below:</p>
            <a href="${confirmationUrl}" style="display: inline-block; background-color: #DC143C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 16px 0;">Confirm Email</a>
            <p>Once your email is confirmed, you'll be able to log in to your dashboard where you can track your verification status.</p>
            <p>If you have any questions, please don't hesitate to contact our support team.</p>
            <p>Best regards,<br>The Auto Market Team</p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      throw new Error(`Failed to send email: ${await res.text()}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
};

serve(handler);