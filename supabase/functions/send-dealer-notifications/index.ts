
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Processing dealer email notifications");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get distinct car_ids that have already been notified (limit to prevent large queries)
    const { data: notifiedCars, error: notifiedError } = await supabase
      .from('system_logs')
      .select('details')
      .eq('log_type', 'dealer_bid_accepted_email_sent')
      .not('details->car_id', 'is', null)
      .limit(100); // Safety limit

    if (notifiedError) {
      console.error("Error fetching notified cars:", notifiedError);
      throw notifiedError;
    }

    // Extract unique car_ids from the notified cars
    const notifiedCarIds = [...new Set(
      notifiedCars
        ?.map(log => log.details?.car_id)
        .filter(carId => carId != null) || []
    )];

    console.log(`Found ${notifiedCarIds.length} unique cars that were already notified`);

    // Get all pending notifications first
    const { data: pendingNotifications, error } = await supabase
      .from('dealer_won_vehicles')
      .select(`
        id,
        dealer_id,
        car_id,
        winning_bid_amount,
        vehicle_make,
        vehicle_model,
        vehicle_year,
        dealers!inner(
          dealership_name,
          user_id
        )
      `)
      .eq('payment_status', 'payment_required')
      .limit(50); // Safety limit to prevent processing too many at once

    if (error) {
      console.error("Error fetching pending notifications:", error);
      throw error;
    }

    console.log(`Found ${pendingNotifications?.length || 0} pending notifications`);

    let emailsSent = 0;
    const results = [];

    for (const notification of pendingNotifications || []) {
      try {
        console.log(`Processing notification for dealer ${notification.dealer_id}, car ${notification.car_id}`);
        
        // Skip if this car was already notified
        if (notifiedCarIds.includes(notification.car_id)) {
          console.log(`Skipping car ${notification.car_id} - already notified`);
          continue;
        }
        
        // Get dealer's email
        const { data: userData } = await supabase.auth.admin.getUserById(notification.dealers.user_id);
        
        if (!userData.user?.email) {
          console.log(`No email found for dealer ${notification.dealer_id}`);
          continue;
        }

        // Call the send-dealer-bid-accepted function
        const { data: emailResult, error: emailError } = await supabase.functions.invoke(
          'send-dealer-bid-accepted',
          {
            body: {
              dealerId: notification.dealer_id,
              carId: notification.car_id,
              winningBid: notification.winning_bid_amount,
              vehicleDetails: {
                make: notification.vehicle_make,
                model: notification.vehicle_model,
                year: notification.vehicle_year
              },
              dealershipName: notification.dealers.dealership_name,
              userEmail: userData.user.email
            }
          }
        );

        if (emailError) {
          console.error(`Error sending email for dealer ${notification.dealer_id}:`, emailError);
          results.push({
            dealer_id: notification.dealer_id,
            car_id: notification.car_id,
            status: 'error',
            error: emailError.message
          });
        } else {
          console.log(`Email sent successfully for dealer ${notification.dealer_id}`);
          emailsSent++;
          results.push({
            dealer_id: notification.dealer_id,
            car_id: notification.car_id,
            status: 'sent',
            email: userData.user.email
          });
        }
      } catch (err) {
        console.error(`Error processing notification for dealer ${notification.dealer_id}:`, err);
        results.push({
          dealer_id: notification.dealer_id,
          car_id: notification.car_id,
          status: 'error',
          error: err instanceof Error ? err.message : String(err)
        });
      }
    }

    console.log(`Dealer notification processing complete. Emails sent: ${emailsSent}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        emails_sent: emailsSent,
        total_processed: results.length,
        results,
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error) {
    console.error("Error in dealer notifications processing:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
