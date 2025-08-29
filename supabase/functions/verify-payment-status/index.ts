import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, vehicleId } = await req.json();

    // Either sessionId + vehicleId OR just vehicleId is required
    if (!vehicleId) {
      throw new Error("Vehicle ID is required");
    }

    // Create Supabase client with service role for database updates
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    let session;
    let paymentStatus;

    if (sessionId) {
      // Use provided session ID
      session = await stripe.checkout.sessions.retrieve(sessionId);
      paymentStatus = session.payment_status;
      console.log('Payment session status:', paymentStatus, 'for vehicle:', vehicleId);
  } else {
    // Look up current payment status from database - DO NOT MODIFY without Stripe confirmation
    const { data: vehicle, error: vehicleError } = await supabaseService
      .from('dealer_won_vehicles')
      .select('stripe_payment_intent_id, payment_status, seller_details_unlocked')
      .eq('id', vehicleId)
      .single();

    if (vehicleError || !vehicle) {
      throw new Error('Vehicle not found');
    }

    if (!vehicle.stripe_payment_intent_id) {
      // No payment intent stored - return current database status without modification
      console.log('No payment intent found for vehicle:', vehicleId, '- returning current DB status:', vehicle.payment_status);
      
      // SECURITY: Do not assume payment success - return current status from DB
      return new Response(
        JSON.stringify({ 
          success: true, 
          payment_status: vehicle.payment_status || 'payment_required',
          seller_details_unlocked: vehicle.seller_details_unlocked || false,
          message: 'Current status returned - no payment verification performed'
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } else {
      // Retrieve payment intent from Stripe for verification
      const paymentIntent = await stripe.paymentIntents.retrieve(vehicle.stripe_payment_intent_id);
      paymentStatus = paymentIntent.status === 'succeeded' ? 'paid' : paymentIntent.status;
      console.log('Stripe payment intent status:', paymentStatus, 'for vehicle:', vehicleId);
    }
  }

    if (paymentStatus === 'paid') {
      // Payment was successful, unlock seller details
      const { error: updateError } = await supabaseService
        .from('dealer_won_vehicles')
        .update({
          payment_status: 'paid',
          payment_date: new Date().toISOString(),
          seller_details_unlocked: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', vehicleId);

      if (updateError) {
        console.error('Error updating payment status:', updateError);
        throw new Error('Failed to update payment status');
      }

      console.log('Successfully unlocked seller details for vehicle:', vehicleId);

      return new Response(
        JSON.stringify({ 
          success: true, 
          payment_status: 'paid',
          seller_details_unlocked: true
        }), 
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } else {
      // Payment not completed
      return new Response(
        JSON.stringify({ 
          success: false, 
          payment_status: paymentStatus,
          seller_details_unlocked: false
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

  } catch (error) {
    console.error('Error verifying payment status:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});