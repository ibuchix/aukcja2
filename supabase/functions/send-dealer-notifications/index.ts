
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

    // Get dealer_won_vehicles that need email notifications
    // Only those where seller has accepted the bid and email hasn't been sent yet
    const { data: wonVehicles, error: wonVehiclesError } = await supabase
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
      .limit(20); // Process max 20 at a time to avoid issues

    if (wonVehiclesError) {
      console.error("Error fetching won vehicles:", wonVehiclesError);
      throw wonVehiclesError;
    }

    console.log(`Found ${wonVehicles?.length || 0} potential notifications to process`);

    let emailsSent = 0;
    const results = [];

    // Process with rate limiting (3 second delay between emails to respect Resend limits)
    for (let i = 0; i < (wonVehicles || []).length; i++) {
      const vehicle = wonVehicles![i];
      
      try {
        console.log(`Processing vehicle ${vehicle.car_id} for dealer ${vehicle.dealer_id}`);
        
        // Check if seller has actually accepted this bid recently
        const { data: sellerDecision } = await supabase
          .from('seller_bid_decisions')
          .select('decision, decided_at')
          .eq('car_id', vehicle.car_id)
          .eq('decision', 'accepted')
          .order('decided_at', { ascending: false })
          .limit(1)
          .single();

        if (!sellerDecision) {
          console.log(`No accepted seller decision found for car ${vehicle.car_id}`);
          continue;
        }

        // Check if we already sent an email for this specific car/dealer combination
        const { data: existingEmailLog } = await supabase
          .from('system_logs')
          .select('id')
          .eq('log_type', 'dealer_bid_accepted_email_sent')
          .eq('details->car_id', vehicle.car_id)
          .eq('details->dealer_id', vehicle.dealer_id)
          .limit(1)
          .single();

        if (existingEmailLog) {
          console.log(`Email already sent for dealer ${vehicle.dealer_id}, car ${vehicle.car_id}`);
          continue;
        }

        // Get dealer's email
        const { data: userData } = await supabase.auth.admin.getUserById(vehicle.dealers.user_id);
        
        if (!userData.user?.email) {
          console.log(`No email found for dealer ${vehicle.dealer_id}`);
          results.push({
            dealer_id: vehicle.dealer_id,
            car_id: vehicle.car_id,
            status: 'error',
            error: 'No email address found'
          });
          continue;
        }

        // Rate limiting: Wait 3 seconds between emails (except for first email)
        if (i > 0) {
          console.log("Waiting 3 seconds to respect rate limits...");
          await new Promise(resolve => setTimeout(resolve, 3000));
        }

        // Call the send-dealer-bid-accepted function
        const { data: emailResult, error: emailError } = await supabase.functions.invoke(
          'send-dealer-bid-accepted',
          {
            body: {
              dealerId: vehicle.dealer_id,
              carId: vehicle.car_id,
              winningBid: vehicle.winning_bid_amount,
              vehicleDetails: {
                make: vehicle.vehicle_make,
                model: vehicle.vehicle_model,
                year: vehicle.vehicle_year
              },
              dealershipName: vehicle.dealers.dealership_name,
              dealerEmail: userData.user.email
            }
          }
        );

        if (emailError) {
          console.error(`Error sending email for dealer ${vehicle.dealer_id}:`, emailError);
          results.push({
            dealer_id: vehicle.dealer_id,
            car_id: vehicle.car_id,
            status: 'error',
            error: emailError.message
          });
        } else {
          console.log(`Email sent successfully for dealer ${vehicle.dealer_id}`);
          emailsSent++;
          
          // Log that email was sent to prevent duplicates
          await supabase
            .from('system_logs')
            .insert({
              log_type: 'dealer_bid_accepted_email_sent',
              message: 'Email sent to dealer for accepted bid',
              details: {
                dealer_id: vehicle.dealer_id,
                car_id: vehicle.car_id,
                email: userData.user.email,
                dealership_name: vehicle.dealers.dealership_name,
                winning_bid: vehicle.winning_bid_amount,
                email_id: emailResult?.emailId
              }
            });
          
          results.push({
            dealer_id: vehicle.dealer_id,
            car_id: vehicle.car_id,
            status: 'sent',
            email: userData.user.email
          });
        }
      } catch (err) {
        console.error(`Error processing vehicle ${vehicle.car_id} for dealer ${vehicle.dealer_id}:`, err);
        results.push({
          dealer_id: vehicle.dealer_id,
          car_id: vehicle.car_id,
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
