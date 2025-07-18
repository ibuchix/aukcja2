import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Check for dealers that need bid accepted notifications
    const { data: pendingNotifications } = await supabase
      .from('system_logs')
      .select('*')
      .eq('log_type', 'dealer_bid_accepted_email_queued')
      .order('created_at', { ascending: true })
      .limit(10);

    if (!pendingNotifications || pendingNotifications.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No pending dealer notifications found',
        processed: 0 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    let processed = 0;
    let errors = 0;

    for (const notification of pendingNotifications) {
      try {
        const details = notification.details;
        const wonVehicleId = details.won_vehicle_id;

        // Get dealer and user information
        const { data: dealerInfo } = await supabase
          .from('dealer_won_vehicles')
          .select(`
            *,
            dealers!inner(
              user_id,
              dealership_name
            )
          `)
          .eq('id', wonVehicleId)
          .single();

        if (!dealerInfo) {
          throw new Error(`Won vehicle record not found: ${wonVehicleId}`);
        }

        // Get user email
        const { data: userData } = await supabase.auth.admin.getUserById(dealerInfo.dealers.user_id);
        const dealerEmail = userData.user?.email;

        if (!dealerEmail) {
          throw new Error(`Dealer email not found for user: ${dealerInfo.dealers.user_id}`);
        }

        // Call the send-dealer-bid-accepted function
        const emailPayload = {
          dealerId: dealerInfo.dealer_id,
          carId: dealerInfo.car_id,
          winningBid: dealerInfo.winning_bid_amount,
          vehicleDetails: {
            make: dealerInfo.vehicle_make,
            model: dealerInfo.vehicle_model,
            year: dealerInfo.vehicle_year
          },
          dealershipName: dealerInfo.dealers.dealership_name,
          userEmail: dealerEmail
        };

        const emailResponse = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-dealer-bid-accepted`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`
          },
          body: JSON.stringify(emailPayload)
        });

        if (emailResponse.ok) {
          // Mark notification as processed by deleting the queued log
          await supabase
            .from('system_logs')
            .delete()
            .eq('id', notification.id);

          processed++;
        } else {
          const errorData = await emailResponse.text();
          throw new Error(`Email service error: ${errorData}`);
        }

      } catch (error) {
        console.error(`Error processing notification ${notification.id}:`, error);
        
        // Log the specific error
        await supabase.from('system_logs').insert({
          log_type: 'dealer_notification_processing_error',
          message: `Failed to process dealer notification: ${notification.id}`,
          error_message: error.message,
          details: {
            notification_id: notification.id,
            original_details: notification.details,
            error: error.toString()
          }
        });

        errors++;
      }
    }

    // Log the batch processing result
    await supabase.from('system_logs').insert({
      log_type: 'dealer_notification_batch_complete',
      message: 'Completed batch processing of dealer notifications',
      details: {
        total_notifications: pendingNotifications.length,
        processed: processed,
        errors: errors,
        timestamp: new Date().toISOString()
      }
    });

    return new Response(JSON.stringify({ 
      success: true, 
      processed: processed,
      errors: errors,
      total: pendingNotifications.length
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in dealer notifications processor:", error);
    
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