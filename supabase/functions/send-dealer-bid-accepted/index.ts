import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

interface EmailRequest {
  dealerId: string;
  carId: string;
  winningBid: number;
  vehicleDetails: {
    make: string;
    model: string;
    year: number;
  };
  dealerEmail: string;
  dealershipName: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { dealerId, carId, winningBid, vehicleDetails, dealerEmail, dealershipName }: EmailRequest = await req.json();

    console.log(`Processing bid accepted email for dealer ${dealerId}, car ${carId}`);

    // Validate required fields
    if (!dealerId || !carId || !winningBid || !dealerEmail) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Email service not configured' }),
        { 
          status: 500, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    // Prepare email content
    const vehicleTitle = `${vehicleDetails.year} ${vehicleDetails.make} ${vehicleDetails.model}`;
    const formattedBid = new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN'
    }).format(winningBid);

    const emailHtml = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
              🎉 Congratulations! Your Bid Has Been Accepted
            </h1>
            
            <p>Dear ${dealershipName},</p>
            
            <p>Great news! The seller has <strong>accepted your winning bid</strong> for the following vehicle:</p>
            
            <div style="background-color: #f3f4f6; border-left: 4px solid #2563eb; padding: 20px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #1f2937;">${vehicleTitle}</h3>
              <p style="margin: 5px 0; font-size: 18px;"><strong>Your Winning Bid: ${formattedBid}</strong></p>
            </div>

            <h3 style="color: #1f2937;">Next Steps:</h3>
            <ol style="padding-left: 20px;">
              <li><strong>Payment Required:</strong> Please log into your dealer portal to complete the payment process.</li>
              <li><strong>Platform Fee:</strong> The applicable platform fee will be calculated and displayed during payment.</li>
              <li><strong>Vehicle Collection:</strong> Once payment is confirmed, you'll receive the seller's contact details for collection arrangements.</li>
            </ol>

            <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #92400e;">
                <strong>⚠️ Important:</strong> Payment must be completed within 48 hours to secure this vehicle.
              </p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="https://your-dealer-portal.com/won-vehicles" 
                 style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Complete Payment Now
              </a>
            </div>

            <p>If you have any questions, please don't hesitate to contact our support team.</p>
            
            <p>Best regards,<br>The Auction Team</p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="font-size: 12px; color: #6b7280;">
              This email was sent to ${dealerEmail} regarding your winning bid for car ID: ${carId}
            </p>
          </div>
        </body>
      </html>
    `;

    // Send email via Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'noreply@your-auction-platform.com',
        to: [dealerEmail],
        subject: `🎉 Bid Accepted - ${vehicleTitle} (${formattedBid})`,
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('Resend API error:', errorText);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to send email: ${emailResponse.status} ${errorText}` 
        }),
        { 
          status: 500, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    const emailResult = await emailResponse.json();
    console.log(`Email sent successfully to ${dealerEmail} for car ${carId}, email ID: ${emailResult.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailId: emailResult.id,
        message: `Email sent to ${dealerEmail}` 
      }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );

  } catch (error) {
    console.error('Error sending dealer bid accepted email:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  }
});