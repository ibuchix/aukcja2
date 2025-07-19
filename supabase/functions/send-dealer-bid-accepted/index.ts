
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DealerNotificationRequest {
  dealerId: string;
  carId: string;
  winningBid: number;
  vehicleDetails: {
    make: string;
    model: string;
    year: number;
  };
  dealershipName: string;
  userEmail?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { dealerId, carId, winningBid, vehicleDetails, dealershipName, userEmail } = await req.json() as DealerNotificationRequest;

    // Check if email was already sent for this dealer/car combination to prevent duplicates
    const { data: existingEmailLog } = await supabase
      .from('system_logs')
      .select('id')
      .eq('log_type', 'dealer_bid_accepted_email_sent')
      .eq('details->dealer_id', dealerId)
      .eq('details->car_id', carId)
      .limit(1);

    if (existingEmailLog && existingEmailLog.length > 0) {
      console.log(`Email already sent for dealer ${dealerId} and car ${carId}`);
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Email already sent',
        sentTo: userEmail || 'unknown'
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get dealer user email if not provided
    let dealerEmail = userEmail;
    if (!dealerEmail) {
      const { data: dealerData } = await supabase
        .from('dealers')
        .select(`
          user_id,
          profiles!inner(id)
        `)
        .eq('id', dealerId)
        .single();

      if (dealerData?.user_id) {
        const { data: userData } = await supabase.auth.admin.getUserById(dealerData.user_id);
        dealerEmail = userData.user?.email;
      }
    }

    if (!dealerEmail) {
      throw new Error('Could not find dealer email address');
    }

    // Format the winning bid amount
    const formattedBid = new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      minimumFractionDigits: 0,
    }).format(winningBid);

    const vehicle = `${vehicleDetails.year} ${vehicleDetails.make} ${vehicleDetails.model}`;
    const dashboardUrl = `${Deno.env.get("SITE_URL")}/dealer/dashboard/won-vehicles`;

    const emailResponse = await resend.emails.send({
      from: "Auto-Strada <notifications@auto-strada.pl>", // FIXED: Using verified domain
      to: [dealerEmail],
      subject: `🎉 Your bid has been accepted for ${vehicle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #10b981; margin: 0; font-size: 28px;">🎉 Congratulations!</h1>
              <h2 style="color: #333; margin: 10px 0 0 0; font-size: 24px;">Your bid has been accepted</h2>
            </div>
            
            <div style="background-color: #f0fdf4; border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #065f46; margin: 0 0 15px 0; font-size: 20px;">Vehicle Details</h3>
              <p style="color: #374151; font-size: 18px; margin: 5px 0;"><strong>${vehicle}</strong></p>
              <p style="color: #374151; font-size: 18px; margin: 5px 0;"><strong>Your winning bid:</strong> ${formattedBid}</p>
              <p style="color: #374151; font-size: 16px; margin: 5px 0;"><strong>Dealership:</strong> ${dealershipName}</p>
            </div>

            <div style="background-color: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #92400e; margin: 0 0 15px 0; font-size: 18px;">⏰ Next Steps</h3>
              <ol style="color: #374151; margin: 0; padding-left: 20px;">
                <li style="margin: 8px 0;">Complete payment to secure your purchase</li>
                <li style="margin: 8px 0;">Access seller contact details</li>
                <li style="margin: 8px 0;">Arrange vehicle collection</li>
              </ol>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${dashboardUrl}" 
                 style="background-color: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold; display: inline-block;">
                Go to Dashboard →
              </a>
            </div>

            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                Please complete your payment within 48 hours to avoid cancellation.
              </p>
              <p style="color: #6b7280; font-size: 12px; margin: 10px 0 0 0;">
                This is an automated message from Auto-Strada.
              </p>
            </div>
          </div>
        </div>
      `,
    });

    // Log successful email send with deduplication tracking
    await supabase.from('system_logs').insert({
      log_type: 'dealer_bid_accepted_email_sent',
      message: 'Successfully sent bid accepted email to dealer',
      details: {
        dealer_id: dealerId,
        car_id: carId,
        email: dealerEmail,
        vehicle: vehicle,
        winning_bid: winningBid,
        resend_response: emailResponse,
        timestamp: new Date().toISOString()
      }
    });

    console.log("Dealer bid accepted email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      emailResponse,
      sentTo: dealerEmail
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error sending dealer bid accepted email:", error);
    
    // Log error to system_logs if possible
    try {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );
      
      await supabase.from('system_logs').insert({
        log_type: 'dealer_bid_accepted_email_error',
        message: 'Failed to send bid accepted email to dealer',
        error_message: error.message,
        details: { error: error.toString() }
      });
    } catch (logError) {
      console.error("Failed to log error:", logError);
    }

    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
