
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
    console.log("Processing specific ended auctions for BMW M4 and AUDI A3");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const now = new Date().toISOString();
    const results = [];

    // Find the specific cars: 2017 BMW M4 and 2013 AUDI A3
    const { data: targetCars, error: carsError } = await supabase
      .from("cars")
      .select("*")
      .or("and(make.ilike.BMW,model.ilike.M4,year.eq.2017),and(make.ilike.AUDI,model.ilike.A3,year.eq.2013)")
      .eq("auction_status", "ended");

    if (carsError) {
      console.error("Error finding target cars:", carsError);
      throw carsError;
    }

    console.log(`Found ${targetCars?.length || 0} target cars to process`);

    for (const car of targetCars || []) {
      console.log(`Processing ${car.year} ${car.make} ${car.model} (ID: ${car.id})`);
      
      // Check if already processed
      const { data: existingWonVehicle } = await supabase
        .from("dealer_won_vehicles")
        .select("id")
        .eq("car_id", car.id)
        .maybeSingle();

      if (existingWonVehicle) {
        console.log(`Car ${car.id} already has won vehicle record, skipping`);
        results.push({
          car_id: car.id,
          make: car.make,
          model: car.model,
          year: car.year,
          status: "already_processed"
        });
        continue;
      }

      // Check if seller accepted the bid
      const { data: sellerDecision } = await supabase
        .from("seller_bid_decisions")
        .select("*")
        .eq("car_id", car.id)
        .eq("decision", "accepted")
        .maybeSingle();

      if (!sellerDecision) {
        console.log(`No accepted seller decision found for car ${car.id}`);
        results.push({
          car_id: car.id,
          make: car.make,
          model: car.model,
          year: car.year,
          status: "no_seller_acceptance"
        });
        continue;
      }

      // Find the winning bid
      const { data: winningBid } = await supabase
        .from("bids")
        .select("*")
        .eq("car_id", car.id)
        .order("amount", { ascending: false })
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (!winningBid) {
        console.log(`No bids found for car ${car.id}`);
        results.push({
          car_id: car.id,
          make: car.make,
          model: car.model,
          year: car.year,
          status: "no_bids"
        });
        continue;
      }

      // Get second highest bid
      const { data: secondHighestBid } = await supabase
        .from("bids")
        .select("amount")
        .eq("car_id", car.id)
        .neq("dealer_id", winningBid.dealer_id)
        .order("amount", { ascending: false })
        .limit(1)
        .maybeSingle();

      // Calculate platform fee based on winning bid
      const calculatePlatformFee = (amount: number): number => {
        if (amount < 5000) return 600;
        if (amount < 10000) return 700;
        if (amount < 20000) return 800;
        if (amount < 30000) return 900;
        if (amount < 40000) return 1000;
        if (amount < 50000) return 1100;
        if (amount < 60000) return 1200;
        if (amount < 70000) return 1300;
        if (amount < 80000) return 1400;
        if (amount < 90000) return 1500;
        if (amount < 100000) return 1600;
        if (amount < 125000) return 1700;
        if (amount < 150000) return 1800;
        if (amount < 175000) return 1900;
        if (amount < 200000) return 2050;
        if (amount < 225000) return 2150;
        if (amount < 250000) return 2250;
        if (amount < 300000) return 2550;
        if (amount < 350000) return 2650;
        if (amount < 400000) return 2750;
        if (amount < 500000) return 2850;
        return 3150;
      };

      const platformFee = calculatePlatformFee(winningBid.amount);

      // Create won vehicle record
      const { data: wonVehicle, error: wonVehicleError } = await supabase
        .from("dealer_won_vehicles")
        .insert({
          dealer_id: winningBid.dealer_id,
          car_id: car.id,
          winning_bid_amount: winningBid.amount,
          original_bid_amount: winningBid.amount,
          second_highest_bid: secondHighestBid?.amount || null,
          platform_fee: platformFee,
          auction_end_time: car.auction_end_time || now,
          payment_status: "payment_required", // Since seller already accepted
          seller_details_unlocked: false,
          vehicle_make: car.make || "Unknown",
          vehicle_model: car.model || "Unknown",
          vehicle_year: car.year || 2000,
          vehicle_mileage: car.mileage || 0,
          vehicle_images: car.images ? JSON.stringify(car.images) : '[]'
        })
        .select()
        .single();

      if (wonVehicleError) {
        console.error(`Error creating won vehicle for ${car.id}:`, wonVehicleError);
        results.push({
          car_id: car.id,
          make: car.make,
          model: car.model,
          year: car.year,
          status: "error",
          error: wonVehicleError.message
        });
        continue;
      }

      // Update bid status
      await supabase
        .from("bids")
        .update({ status: "won" })
        .eq("id", winningBid.id);

      await supabase
        .from("bids")
        .update({ status: "lost" })
        .eq("car_id", car.id)
        .neq("id", winningBid.id);

      // Update car status
      await supabase
        .from("cars")
        .update({ 
          auction_status: "sold",
          current_bid: winningBid.amount,
          updated_at: now
        })
        .eq("id", car.id);

      console.log(`Successfully created won vehicle record for ${car.year} ${car.make} ${car.model}`);
      
      results.push({
        car_id: car.id,
        make: car.make,
        model: car.model,
        year: car.year,
        status: "processed",
        winning_bid: winningBid.amount,
        dealer_id: winningBid.dealer_id,
        platform_fee: platformFee,
        won_vehicle_id: wonVehicle.id
      });
    }

    console.log("Processing complete:", results);

    return new Response(
      JSON.stringify({ 
        success: true,
        processed_count: results.length,
        results,
        timestamp: now
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error) {
    console.error("Error processing specific auctions:", error);
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
