import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { testEmail } = await req.json();
    
    if (!testEmail) {
      return new Response(
        JSON.stringify({ error: 'testEmail is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    console.log(`Testing email trigger with test email: ${testEmail}`);

    // Create a test dealer first (or update existing)
    const testDealerId = 'test-dealer-id-123';
    await supabase
      .from('dealers')
      .upsert({
        id: testDealerId,
        email: testEmail,
        dealership_name: 'Test Dealership',
        user_id: 'test-user-id',
        is_verified: true
      });

    // Create a test car
    const testCarId = 'test-car-id-123';
    await supabase
      .from('cars')
      .upsert({
        id: testCarId,
        seller_id: 'test-seller-id',
        make: 'BMW',
        model: 'X5',
        year: 2022,
        title: '2022 BMW X5',
        status: 'auction_ended'
      });

    // Create a test won vehicle record
    await supabase
      .from('dealer_won_vehicles')
      .upsert({
        dealer_id: testDealerId,
        car_id: testCarId,
        winning_bid_amount: 85000,
        payment_status: 'awaiting_seller_decision'
      });

    // Now trigger the email by creating a seller decision
    const { data, error } = await supabase
      .from('seller_bid_decisions')
      .upsert({
        car_id: testCarId,
        highest_bid_dealer_id: testDealerId,
        decision: 'accepted',
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error creating seller decision:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Test email trigger created for ${testEmail}`,
        testData: {
          dealerId: testDealerId,
          carId: testCarId,
          vehicleTitle: '2022 BMW X5',
          winningBid: 85000
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error) {
    console.error('Error in test-dealer-email function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});