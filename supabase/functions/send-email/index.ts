
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

// Create a simple semaphore for concurrency control
const emailSemaphore = {
  count: 0,
  max: 10, // Maximum concurrent email sends
  queue: [] as Array<() => void>,
  
  async acquire() {
    if (this.count < this.max) {
      this.count++;
      return true;
    }
    
    // Return a promise that resolves when a semaphore is released
    return new Promise<void>(resolve => {
      this.queue.push(resolve);
    });
  },
  
  release() {
    this.count--;
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      if (next) {
        this.count++;
        next();
      }
    }
  }
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Received request to send email");
    const { to, subject, html, from = "Auto-Strada <welcome@auto-strada.pl>" }: EmailRequest = await req.json();

    console.log(`Sending email to ${to} with subject "${subject}"`);
    
    if (!to || !subject || !html) {
      console.error("Missing required email parameters");
      return new Response(
        JSON.stringify({ error: "Missing required parameters (to, subject, html)" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Acquire semaphore before sending email
    await emailSemaphore.acquire();
    
    try {
      const emailResponse = await resend.emails.send({
        from,
        to: [to],
        subject,
        html,
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
      console.error("Error in send-email Resend API call:", error);
      return new Response(
        JSON.stringify({ 
          error: error.message,
          code: error.statusCode || 500,
          name: error.name
        }),
        {
          status: error.statusCode || 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    } finally {
      // Always release the semaphore
      emailSemaphore.release();
    }
  } catch (error: any) {
    console.error("Error in send-email function:", error);
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
