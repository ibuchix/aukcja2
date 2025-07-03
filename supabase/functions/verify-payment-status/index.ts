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

    if (!sessionId || !vehicleId) {
      throw new Error("Session ID and vehicle ID are required");
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

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    console.log('Payment session status:', session.payment_status, 'for vehicle:', vehicleId);

    if (session.payment_status === 'paid') {
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
          payment_status: session.payment_status,
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