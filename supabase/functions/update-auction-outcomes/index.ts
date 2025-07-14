import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createServiceClient } from "../_shared/supabase-client.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Running comprehensive auction processing function");
    const supabase = createServiceClient();
    const now = new Date().toISOString();

    console.log(`Current time (UTC): ${now}`);

    // Step 1: Update auction schedule statuses
    console.log("Step 1: Updating auction schedule statuses...");
    
    // Start scheduled auctions
    const { data: startedSchedules, error: startError } = await supabase
      .from("auction_schedules")
      .update({ 
        status: "running",
        last_status_change: now,
        updated_at: now
      })
      .eq("status", "scheduled")
      .lte("start_time", now)
      .select("id, car_id, start_time, end_time");

    if (startError) {
      console.error("Error updating started schedules:", startError);
    } else {
      console.log(`Started ${startedSchedules?.length || 0} auctions`);
    }

    // Complete running auctions
    const { data: endedSchedules, error: endError } = await supabase
      .from("auction_schedules")
      .update({ 
        status: "completed",
        last_status_change: now,
        updated_at: now
      })
      .eq("status", "running")
      .lte("end_time", now)
      .select("id, car_id, start_time, end_time");

    if (endError) {
      console.error("Error updating ended schedules:", endError);
    } else {
      console.log(`Completed ${endedSchedules?.length || 0} auctions`);
    }

    // Step 2: Update car statuses for ended schedules
    if (endedSchedules && endedSchedules.length > 0) {
      console.log("Step 2: Updating car statuses for ended auctions...");
      const carIds = endedSchedules.map(s => s.car_id);
      
      const { data: endedCars, error: carUpdateError } = await supabase
        .from("cars")
        .update({ 
          auction_status: "ended",
          updated_at: now
        })
        .in("id", carIds)
        .eq("auction_status", "active")
        .select("id, title, current_bid, reserve_price, make, model, year, mileage, images");

      if (carUpdateError) {
        console.error("Error updating car statuses:", carUpdateError);
      } else {
        console.log(`Updated ${endedCars?.length || 0} cars to 'ended' status`);
      }
    }

    // Step 3: Find and process ALL ended auctions that haven't been processed
    console.log("Step 3: Finding all ended auctions to process...");
    const { data: endedAuctions, error: auctionError } = await supabase
      .from("cars")
      .select("id, title, current_bid, reserve_price, auction_status, make, model, year, mileage, images, auction_end_time")
      .eq("auction_status", "ended")
      .not("id", "in", `(SELECT car_id FROM dealer_won_vehicles)`);

    if (auctionError) {
      console.error("Error finding ended auctions:", auctionError);
      throw auctionError;
    }

    console.log(`Found ${endedAuctions?.length || 0} ended auctions to process`);

    const results = [];
    let processedCount = 0;
    let wonVehiclesCreated = 0;

    // Step 4: Process each ended auction comprehensively
    for (const auction of endedAuctions || []) {
      try {
        console.log(`Processing auction ${auction.id} (${auction.make} ${auction.model})`);
        
        // Check if already processed to be extra safe
        const { data: existingWonVehicle } = await supabase
          .from("dealer_won_vehicles")
          .select("id")
          .eq("car_id", auction.id)
          .maybeSingle();

        if (existingWonVehicle) {
          console.log(`Auction ${auction.id} already processed, skipping`);
          continue;
        }

        // Find highest bid
        const { data: highestBid, error: bidError } = await supabase
          .from("bids")
          .select("id, dealer_id, amount, created_at")
          .eq("car_id", auction.id)
          .order("amount", { ascending: false })
          .order("created_at", { ascending: true })
          .limit(1);

        if (bidError || !highestBid || highestBid.length === 0) {
          console.log(`No bids found for auction ${auction.id}`);
          
          // Mark car as ended without bids
          await supabase
            .from("cars")
            .update({ 
              auction_status: "ended",
              auction_end_time: now,
              updated_at: now
            })
            .eq("id", auction.id);

          results.push({
            auction_id: auction.id,
            status: "ended_no_bids",
            processed: true
          });
          processedCount++;
          continue;
        }

        const winningBid = highestBid[0];
        const reservePriceMet = winningBid.amount >= auction.reserve_price;
        
        if (reservePriceMet) {
          console.log(`Auction ${auction.id} has winning bid: ${winningBid.amount} >= ${auction.reserve_price}`);
          
          // Get second highest bid for fee calculation
          const { data: secondHighestBid } = await supabase
            .from("bids")
            .select("amount")
            .eq("car_id", auction.id)
            .neq("dealer_id", winningBid.dealer_id)
            .order("amount", { ascending: false })
            .limit(1);

          // Mark car as sold
          await supabase
            .from("cars")
            .update({ 
              auction_status: "sold",
              current_bid: winningBid.amount,
              auction_end_time: now,
              updated_at: now
            })
            .eq("id", auction.id);

          // Update bid statuses
          await supabase
            .from("bids")
            .update({ status: "winning" })
            .eq("id", winningBid.id);

          await supabase
            .from("bids")
            .update({ status: "lost" })
            .eq("car_id", auction.id)
            .neq("id", winningBid.id);

          // Create dealer won vehicle record immediately with awaiting seller decision status
          const { error: wonVehicleError } = await supabase
            .from("dealer_won_vehicles")
            .insert({
              dealer_id: winningBid.dealer_id,
              car_id: auction.id,
              winning_bid_amount: winningBid.amount,
              original_bid_amount: winningBid.amount,
              second_highest_bid: secondHighestBid?.[0]?.amount || null,
              platform_fee: 0, // Will be calculated later
              auction_end_time: now,
              payment_status: "awaiting_seller_decision",
              seller_details_unlocked: false,
              vehicle_make: auction.make || "",
              vehicle_model: auction.model || "",
              vehicle_year: auction.year || 0,
              vehicle_mileage: auction.mileage || 0,
              vehicle_images: auction.images ? JSON.stringify(auction.images) : '[]'
            });

          if (wonVehicleError) {
            console.error(`Error creating won vehicle record for ${auction.id}:`, wonVehicleError);
          } else {
            console.log(`Created won vehicle record for auction ${auction.id}`);
            wonVehiclesCreated++;
          }

          results.push({
            auction_id: auction.id,
            status: "sold",
            winning_bid: winningBid.amount,
            dealer_id: winningBid.dealer_id,
            processed: true
          });
        } else {
          console.log(`Auction ${auction.id} ended without meeting reserve: ${winningBid.amount} < ${auction.reserve_price}`);
          
          // Mark car as ended
          await supabase
            .from("cars")
            .update({ 
              auction_status: "ended",
              current_bid: winningBid.amount,
              auction_end_time: now,
              updated_at: now
            })
            .eq("id", auction.id);

          // Mark all bids as ended
          await supabase
            .from("bids")
            .update({ status: "ended" })
            .eq("car_id", auction.id);

          results.push({
            auction_id: auction.id,
            status: "ended_reserve_not_met",
            highest_bid: winningBid.amount,
            reserve_price: auction.reserve_price,
            processed: true
          });
        }

        processedCount++;
      } catch (err) {
        console.error(`Error processing auction ${auction.id}:`, err);
        results.push({
          auction_id: auction.id,
          status: "error",
          processed: false,
          error: err instanceof Error ? err.message : String(err)
        });
      }
    }

    console.log(`Auction processing complete: ${processedCount} processed, ${wonVehiclesCreated} won vehicles created`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed_auctions: processedCount,
        won_vehicles_created: wonVehiclesCreated,
        current_time_utc: now,
        schedule_updates: {
          started: startedSchedules?.length || 0,
          completed: endedSchedules?.length || 0
        },
        results 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error) {
    console.error("Error in comprehensive auction processing:", error);
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