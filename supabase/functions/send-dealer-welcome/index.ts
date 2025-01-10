import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  to: string;
  dealerName: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!SENDGRID_API_KEY) {
      console.error('SendGrid API key not configured');
      throw new Error('SendGrid API key not configured');
    }

    const { to, dealerName }: EmailRequest = await req.json();
    
    console.log(`Sending welcome email to dealer: ${dealerName} (${to})`);

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: to }],
          dynamic_template_data: {
            dealer_name: dealerName,
            verification_link: `${Deno.env.get('SUPABASE_URL')}/auth/v1/verify`
          }
        }],
        from: { 
          email: 'noreply@auto-strada.com',
          name: 'Auto-Strada'
        },
        template_id: 'd-your-template-id', // You'll need to create this template in SendGrid
        subject: 'Welcome to Auto-Strada - Please Verify Your Email',
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('SendGrid API error:', errorData);
      throw new Error(`Failed to send email: ${response.statusText}`);
    }

    console.log('Welcome email sent successfully');
    return new Response(
      JSON.stringify({ success: true, message: 'Welcome email sent successfully' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error sending welcome email:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error instanceof Error ? error.stack : undefined
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});