
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
    console.log("Running update-auction-outcomes function");
    const supabase = createServiceClient();

    // Find recently ended auctions (ended in the last hour)
    const { data: endedAuctions, error: auctionError } = await supabase
      .from("cars")
      .select("id, title, current_bid, reserve_price, auction_status")
      .in("auction_status", ["sold", "ended"])
      .gt("updated_at", new Date(Date.now() - 3600000).toISOString()); // Last hour

    if (auctionError) {
      throw auctionError;
    }

    console.log(`Found ${endedAuctions?.length || 0} recently ended auctions`);

    const results = [];

    // Process each ended auction
    for (const auction of endedAuctions || []) {
      try {
        // Find highest bid
        const { data: highestBid, error: bidError } = await supabase
          .from("bids")
          .select("id, dealer_id, amount")
          .eq("car_id", auction.id)
          .order("amount", { ascending: false })
          .limit(1)
          .single();

        if (bidError) {
          console.error(`No bids found for auction ${auction.id}`);
          continue;
        }

        // If auction was sold (reserve price met), update winner
        if (auction.auction_status === "sold" && highestBid) {
          // Update winning bid
          const { error: winnerError } = await supabase
            .from("bids")
            .update({ status: "won" })
            .eq("id", highestBid.id);

          if (winnerError) {
            console.error(`Error updating winning bid: ${winnerError.message}`);
          } else {
            console.log(`Updated winning bid ${highestBid.id} for auction ${auction.id}`);
          }

          // Update all other bids for this auction as lost
          const { error: loserError } = await supabase
            .from("bids")
            .update({ status: "lost" })
            .eq("car_id", auction.id)
            .neq("id", highestBid.id);

          if (loserError) {
            console.error(`Error updating losing bids: ${loserError.message}`);
          } else {
            console.log(`Updated losing bids for auction ${auction.id}`);
          }
        } 
        // If auction ended without selling (reserve not met), mark all bids as lost
        else if (auction.auction_status === "ended") {
          const { error: updateError } = await supabase
            .from("bids")
            .update({ status: "lost" })
            .eq("car_id", auction.id);

          if (updateError) {
            console.error(`Error updating bids for ended auction: ${updateError.message}`);
          } else {
            console.log(`Updated all bids as lost for ended auction ${auction.id}`);
          }
        }

        results.push({
          auction_id: auction.id,
          status: auction.auction_status,
          processed: true
        });
      } catch (err) {
        console.error(`Error processing auction ${auction.id}: ${err}`);
        results.push({
          auction_id: auction.id,
          status: auction.auction_status,
          processed: false,
          error: err instanceof Error ? err.message : String(err)
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: results.length,
        results 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error) {
    console.error("Error in update-auction-outcomes function:", error);
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
