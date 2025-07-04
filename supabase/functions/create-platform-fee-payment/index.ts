
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
    console.log('Starting payment creation process...');
    
    // Check for required environment variables
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    
    if (!stripeSecretKey) {
      console.error('Missing STRIPE_SECRET_KEY environment variable');
      throw new Error("Stripe configuration missing. Please configure STRIPE_SECRET_KEY.");
    }
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase configuration');
      throw new Error("Supabase configuration missing");
    }

    const { vehicleId, platformFee } = await req.json();
    console.log('Request payload:', { vehicleId, platformFee });

    if (!vehicleId || !platformFee) {
      console.error('Missing required parameters:', { vehicleId, platformFee });
      throw new Error("Vehicle ID and platform fee are required");
    }

    // Create Supabase client with service role for database operations
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseServiceKey) {
      throw new Error("Supabase service role key not configured");
    }
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error('No authorization header provided');
      throw new Error("Authorization header required");
    }

    const token = authHeader.replace("Bearer ", "");
    console.log('Attempting to authenticate user...');
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user?.email) {
      console.error('Authentication failed:', userError);
      throw new Error("User not authenticated or email not available");
    }

    console.log('User authenticated:', userData.user.email);

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    // Get vehicle details - since RLS is disabled, we can query directly
    console.log('Fetching vehicle details for ID:', vehicleId);
    
    const { data: vehicle, error: vehicleError } = await supabaseClient
      .from('dealer_won_vehicles')
      .select(`
        *,  
        cars (
          make,
          model,
          year,
          mileage,
          images
        )
      `)
      .eq('id', vehicleId)
      .single();

    if (vehicleError) {
      console.error('Vehicle query error:', vehicleError);
      throw new Error(`Vehicle not found: ${vehicleError.message}`);
    }

    if (!vehicle) {
      console.error('No vehicle found with ID:', vehicleId);
      throw new Error("Vehicle not found");
    }

    console.log('Vehicle found:', {
      id: vehicle.id,
      carDetails: vehicle.cars ? 'Present' : 'Missing',
      winningBid: vehicle.winning_bid_amount
    });

    // Check if customer exists in Stripe
    console.log('Checking for existing Stripe customer...');
    const customers = await stripe.customers.list({ 
      email: userData.user.email, 
      limit: 1 
    });
    
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      console.log('Found existing customer:', customerId);
    } else {
      console.log('No existing customer found, will create new one');
    }

    // Build product name safely
    const carInfo = vehicle.cars;
    const productName = carInfo 
      ? `Platform Fee - ${carInfo.year} ${carInfo.make} ${carInfo.model}`
      : `Platform Fee - Vehicle ${vehicleId}`;
    
    const productDescription = `Platform fee for winning bid of ${vehicle.winning_bid_amount} PLN`;

    console.log('Creating Stripe checkout session...');

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : userData.user.email,
      line_items: [
        {
          price_data: {
            currency: "pln",
            product_data: { 
              name: productName,
              description: productDescription
            },
            unit_amount: Math.round(platformFee * 100), // Convert to grosze (Polish cents)
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/dealer/won-vehicles?payment_success=true&session_id={CHECKOUT_SESSION_ID}&vehicle_id=${vehicleId}`,
      cancel_url: `${req.headers.get("origin")}/dealer/won-vehicles?payment_cancelled=true`,
      metadata: {
        vehicle_id: vehicleId,
        dealer_id: vehicle.dealer_id,
        platform_fee: platformFee.toString(),
      }
    });

    console.log('Checkout session created:', session.id);

    // Store payment intent ID in database (RLS is disabled so this should work)
    console.log('Updating vehicle with payment intent ID...');
    const { error: updateError } = await supabaseClient
      .from('dealer_won_vehicles')
      .update({ 
        stripe_payment_intent_id: session.payment_intent,
        updated_at: new Date().toISOString()
      })
      .eq('id', vehicleId);

    if (updateError) {
      console.error('Error updating vehicle with payment intent:', updateError);
      // Don't throw here as the session was created successfully
    } else {
      console.log('Successfully updated vehicle with payment intent');
    }

    console.log('Payment creation successful, returning session URL');

    return new Response(
      JSON.stringify({ 
        url: session.url,
        sessionId: session.id 
      }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in create-platform-fee-payment:', error);
    console.error('Error stack:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred',
        details: error.stack || 'No stack trace available'
      }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
