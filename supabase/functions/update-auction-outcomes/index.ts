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
    console.log("Starting auction processing function");
    
    const supabase = createServiceClient();
    const now = new Date().toISOString();

    console.log(`Current time (UTC): ${now}`);
    
    // Try service role authentication first, fallback to SECURITY DEFINER function
    console.log("Testing service role authentication...");
    const { data: testData, error: testError } = await supabase
      .from("cars")
      .select("id")
      .limit(1);
    
    if (testError) {
      console.error("Service role authentication failed, using SECURITY DEFINER fallback:", testError);
      
      // Use the SECURITY DEFINER function as a fallback
      console.log("Calling secure auction processing function...");
      const { data: fallbackResult, error: fallbackError } = await supabase
        .rpc('process_ended_auctions_securely');
      
      if (fallbackError) {
        console.error("SECURITY DEFINER fallback also failed:", fallbackError);
        throw new Error(`Both service role and SECURITY DEFINER failed: ${fallbackError.message}`);
      }
      
      console.log("✅ SECURITY DEFINER fallback successful:", fallbackResult);
      return new Response(
        JSON.stringify({
          success: true,
          method: 'security_definer_fallback',
          result: fallbackResult,
          timestamp: now
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }
    
    console.log("✅ Service role authentication successful");

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

    // Step 3: Find and process ALL auctions that have ended (regardless of status) and haven't been processed
    console.log("Step 3: Finding all ended auctions to process (checking by end time, not just status)...");
    
    // First get all car IDs that already have won vehicle records
    const { data: processedCarIds, error: processedError } = await supabase
      .from("dealer_won_vehicles")
      .select("car_id");
    
    if (processedError) {
      console.error("Error getting processed car IDs:", processedError);
      throw processedError;
    }
    
    const excludeIds = processedCarIds?.map(record => record.car_id) || [];
    console.log(`Found ${excludeIds.length} already processed car IDs`);
    
    // Get ALL auctions that have passed their end time with simplified query
    console.log("Executing cars query to find ended auctions...");
    let allEndedAuctions;
    let auctionError;
    
    try {
      // Break down the complex query into simpler steps
      console.log("Step 3a: Querying cars with is_auction = true");
      const { data: auctionCars, error: step1Error } = await supabase
        .from("cars")
        .select("id, title, current_bid, reserve_price, auction_status, make, model, year, mileage, images, auction_end_time")
        .eq("is_auction", true);
      
      if (step1Error) {
        console.error("Step 3a failed:", step1Error);
        throw step1Error;
      }
      
      console.log(`Step 3a successful: Found ${auctionCars?.length || 0} auction cars`);
      
      // Filter in JavaScript to avoid complex PostgreSQL queries
      console.log("Step 3b: Filtering ended auctions in JavaScript");
      allEndedAuctions = auctionCars?.filter(car => 
        car.auction_end_time && new Date(car.auction_end_time) < new Date(now)
      ) || [];
      
      console.log(`Step 3b successful: Found ${allEndedAuctions.length} ended auctions`);
      
    } catch (queryError) {
      console.error("Cars query failed:", queryError);
      auctionError = queryError;
    }
    
    if (auctionError) {
      console.error("Error finding ended auctions:", auctionError);
      throw auctionError;
    }
    
    // Filter out already processed auctions in JavaScript
    const endedAuctions = allEndedAuctions?.filter(auction => 
      !excludeIds.includes(auction.id)
    ) || [];
    
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

        // Find all bids for proxy bidding logic (ORDER BY amount DESC, created_at ASC)
        const { data: allBids, error: bidError } = await supabase
          .from("bids")
          .select("id, dealer_id, amount, created_at")
          .eq("car_id", auction.id)
          .order("amount", { ascending: false })
          .order("created_at", { ascending: true });

        if (bidError || !allBids || allBids.length === 0) {
          console.log(`No bids found for auction ${auction.id}`);
          
          // Mark car as ended without bids using simple update
          console.log(`Updating car ${auction.id} status to ended (no bids)`);
          const { error: carUpdateError } = await supabase
            .from("cars")
            .update({ 
              auction_status: "ended",
              updated_at: now
            })
            .eq("id", auction.id);
          
          if (carUpdateError) {
            console.error(`Failed to update car ${auction.id}:`, carUpdateError);
          }

          results.push({
            auction_id: auction.id,
            status: "ended_no_bids",
            processed: true
          });
          processedCount++;
          continue;
        }

        const winningBid = allBids[0]; // Highest bid
        const secondHighestBid = allBids.length > 1 ? allBids[1] : null;
        const reservePriceMet = winningBid.amount >= auction.reserve_price;
        
        console.log(`Auction ${auction.id}: Highest bid ${winningBid.amount}, Second highest: ${secondHighestBid?.amount || 'none'}, Reserve: ${auction.reserve_price}`);
        
        if (reservePriceMet) {
          console.log(`Auction ${auction.id} has winning bid: ${winningBid.amount} >= ${auction.reserve_price}`);
          
          // PROXY BIDDING LOGIC: Calculate winning amount
          let winningAmount = winningBid.amount;
          if (secondHighestBid) {
            const difference = winningBid.amount - secondHighestBid.amount;
            if (difference > 250) {
              // Reduce to 250 ZŁ above second highest
              winningAmount = secondHighestBid.amount + 250;
              console.log(`Proxy bidding applied: ${secondHighestBid.amount} + 250 = ${winningAmount}`);
            } else {
              // Keep original bid if difference is 250 or less
              console.log(`Difference (${difference}) <= 250, using original highest bid: ${winningAmount}`);
            }
          } else {
            console.log(`No second highest bid, using original highest bid: ${winningAmount}`);
          }

          // Check if seller has already made a decision
          const { data: sellerDecision } = await supabase
            .from("seller_bid_decisions")
            .select("decision")
            .eq("car_id", auction.id)
            .maybeSingle();

          const paymentStatus = sellerDecision?.decision === 'accepted' ? 'payment_required' : 'awaiting_seller_decision';

          // Mark car as sold with proxy calculated amount using simple update
          console.log(`Updating car ${auction.id} status to sold with winning amount: ${winningAmount}`);
          const { error: soldCarUpdateError } = await supabase
            .from("cars")
            .update({ 
              auction_status: "sold",
              current_bid: winningAmount,
              updated_at: now,
              awaiting_seller_decision: paymentStatus === 'awaiting_seller_decision'
            })
            .eq("id", auction.id);
          
          if (soldCarUpdateError) {
            console.error(`Failed to update sold car ${auction.id}:`, soldCarUpdateError);
          }

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

          // Create dealer won vehicle record with proxy bidding logic
          const { error: wonVehicleError } = await supabase
            .from("dealer_won_vehicles")
            .insert({
              dealer_id: winningBid.dealer_id,
              car_id: auction.id,
              winning_bid_amount: winningAmount, // Proxy calculated amount
              original_bid_amount: winningBid.amount, // Original highest bid
              second_highest_bid: secondHighestBid?.amount || null,
              platform_fee: 0, // Will be calculated later based on winning amount
              auction_end_time: now,
              payment_status: paymentStatus,
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
            console.log(`Created won vehicle record for auction ${auction.id} with winning amount: ${winningAmount} (original: ${winningBid.amount})`);
            wonVehiclesCreated++;
          }

          results.push({
            auction_id: auction.id,
            status: "sold",
            winning_bid: winningAmount, // Show proxy calculated amount
            original_bid: winningBid.amount,
            dealer_id: winningBid.dealer_id,
            processed: true
          });
        } else {
          console.log(`Auction ${auction.id} ended without meeting reserve: ${winningBid.amount} < ${auction.reserve_price}`);
          
          // Mark car as ended (reserve not met) using simple update
          console.log(`Updating car ${auction.id} status to ended (reserve not met)`);
          const { error: endedCarUpdateError } = await supabase
            .from("cars")
            .update({ 
              auction_status: "ended",
              current_bid: winningBid.amount,
              updated_at: now
            })
            .eq("id", auction.id);
          
          if (endedCarUpdateError) {
            console.error(`Failed to update ended car ${auction.id}:`, endedCarUpdateError);
          }

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