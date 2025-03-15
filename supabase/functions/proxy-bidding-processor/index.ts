
import { createServiceClient } from '../_shared/supabase-client.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { handleError, withErrorHandling } from '../_shared/error-handling.ts';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { checkForRateLimit } from '../_shared/rate-limiter.ts';

// Define a type for the proxy bid object
interface ProxyBid {
  id: string;
  car_id: string;
  dealer_id: string;
  max_bid_amount: number;
  created_at: string;
  updated_at: string;
}

// Define a type for the car object
interface Car {
  id: string;
  current_bid: number;
  minimum_bid_increment: number;
  auction_status: string;
  price: number;
}

interface ProcessResult {
  carId: string;
  processed: boolean;
  newBid?: number;
  previousBid?: number;
  reason?: string;
}

async function processProxyBids(): Promise<{ 
  processed: number; 
  skipped: number; 
  errors: number;
  results: ProcessResult[];
}> {
  const supabase = createServiceClient();
  const startTime = Date.now();
  const results: ProcessResult[] = [];
  
  console.log('Starting proxy bid processing job');
  
  let processed = 0;
  let skipped = 0;
  let errors = 0;
  
  try {
    // 1. Get all active auctions
    const { data: activeAuctions, error: auctionsError } = await supabase
      .from('cars')
      .select('id, current_bid, minimum_bid_increment, auction_status, price')
      .eq('is_auction', true)
      .eq('auction_status', 'active');
    
    if (auctionsError) {
      console.error('Error fetching active auctions:', auctionsError.message);
      throw auctionsError;
    }
    
    console.log(`Found ${activeAuctions?.length || 0} active auctions to process`);
    
    // 2. Process each auction
    for (const auction of activeAuctions || []) {
      try {
        const result = await processAuction(supabase, auction);
        results.push(result);
        
        if (result.processed) {
          processed++;
        } else {
          skipped++;
        }
      } catch (err) {
        console.error(`Error processing auction ${auction.id}:`, err);
        results.push({
          carId: auction.id,
          processed: false,
          reason: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`
        });
        errors++;
      }
    }
    
    const duration = Date.now() - startTime;
    console.log(`Proxy bid processing completed in ${duration}ms. Processed: ${processed}, Skipped: ${skipped}, Errors: ${errors}`);
    
    return { processed, skipped, errors, results };
  } catch (err) {
    console.error('Error in processProxyBids:', err);
    throw err;
  }
}

async function processAuction(supabase: any, auction: Car): Promise<ProcessResult> {
  const { id: carId, current_bid, minimum_bid_increment, price } = auction;
  
  // Default to 250 if minimum_bid_increment is not set
  const bidIncrement = minimum_bid_increment || 250;
  
  console.log(`Processing auction ${carId} with current bid ${current_bid} and increment ${bidIncrement}`);
  
  // 1. Get all proxy bids for this auction, ordered by max amount (highest first)
  const { data: proxyBids, error: proxyBidsError } = await supabase
    .from('proxy_bids')
    .select('*')
    .eq('car_id', carId)
    .order('max_bid_amount', { ascending: false });
  
  if (proxyBidsError) {
    console.error(`Error fetching proxy bids for auction ${carId}:`, proxyBidsError.message);
    return { carId, processed: false, reason: `Error fetching proxy bids: ${proxyBidsError.message}` };
  }
  
  if (!proxyBids || proxyBids.length === 0) {
    console.log(`No proxy bids found for auction ${carId}`);
    return { carId, processed: false, reason: 'No proxy bids found' };
  }
  
  if (proxyBids.length === 1) {
    console.log(`Only one proxy bid found for auction ${carId}, nothing to process`);
    return { carId, processed: false, reason: 'Only one proxy bid found' };
  }
  
  console.log(`Found ${proxyBids.length} proxy bids for auction ${carId}`);
  
  // Get the top two proxy bids
  const topBid = proxyBids[0];
  const secondBid = proxyBids[1];
  
  // Check if the current high bidder is already the top proxy bidder
  const { data: currentHighBid, error: highBidError } = await supabase
    .from('bids')
    .select('dealer_id, amount')
    .eq('car_id', carId)
    .eq('status', 'active')
    .single();
  
  if (highBidError && highBidError.code !== 'PGRST116') { // PGRST116 is "no rows returned" which is fine
    console.error(`Error fetching current high bid for auction ${carId}:`, highBidError.message);
    return { carId, processed: false, reason: `Error fetching high bid: ${highBidError.message}` };
  }
  
  // If the top proxy bidder is already winning, we don't need to do anything
  if (currentHighBid && currentHighBid.dealer_id === topBid.dealer_id) {
    console.log(`Top proxy bidder ${topBid.dealer_id} is already winning auction ${carId}`);
    return { carId, processed: false, reason: 'Top proxy bidder already winning' };
  }
  
  // Calculate what the next bid should be
  const minBid = Math.max(price, (current_bid || 0) + bidIncrement);
  
  // Calculate what the second bidder's max can outbid the current high bid up to
  const secondBidderMax = secondBid.max_bid_amount;
  
  // If the second bidder's max is less than the minimum bid, use the minimum bid
  let nextBidAmount = Math.max(minBid, Math.min(secondBidderMax + bidIncrement, topBid.max_bid_amount));
  
  // Make sure the bid is divisible by the bid increment
  if (nextBidAmount % bidIncrement !== 0) {
    nextBidAmount = Math.floor(nextBidAmount / bidIncrement) * bidIncrement;
  }
  
  console.log(`Calculated next bid for auction ${carId}: ${nextBidAmount} (top max: ${topBid.max_bid_amount}, second max: ${secondBidderMax}, min increment: ${bidIncrement})`);
  
  // If calculated bid is higher than top bidder's max, something went wrong
  if (nextBidAmount > topBid.max_bid_amount) {
    console.error(`Calculated bid ${nextBidAmount} exceeds top bidder's max ${topBid.max_bid_amount}`);
    return { carId, processed: false, reason: 'Calculated bid exceeds top bidder maximum' };
  }
  
  // Place the bid via the place_bid function
  const { data: placeBidResult, error: placeBidError } = await supabase.rpc(
    'place_bid',
    {
      p_car_id: carId,
      p_dealer_id: topBid.dealer_id,
      p_amount: nextBidAmount,
      p_is_proxy: true,
      p_max_proxy_amount: topBid.max_bid_amount
    }
  );
  
  if (placeBidError) {
    console.error(`Error placing proxy bid for auction ${carId}:`, placeBidError.message);
    return { carId, processed: false, reason: `Error placing bid: ${placeBidError.message}` };
  }
  
  console.log(`Successfully placed proxy bid for auction ${carId}:`, placeBidResult);
  
  // Log the action
  await supabase.from('audit_logs').insert({
    user_id: topBid.dealer_id,
    action: 'proxy_bid',
    entity_type: 'car',
    entity_id: carId,
    details: {
      bid_amount: nextBidAmount,
      max_amount: topBid.max_bid_amount,
      outbid_dealer_id: currentHighBid?.dealer_id,
      previous_bid: current_bid,
      auto_processed: true
    }
  });
  
  return { 
    carId, 
    processed: true, 
    newBid: nextBidAmount, 
    previousBid: current_bid 
  };
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  return withErrorHandling(async () => {
    // Check for rate limiting using client IP
    const clientIP = req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = await checkForRateLimit(clientIP, 'proxy-bidding-processor', 60, 5);
    
    if (rateLimitResult.isLimited) {
      return new Response(
        JSON.stringify({ 
          error: 'Too many requests', 
          retryAfter: rateLimitResult.retryAfter 
        }),
        { 
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Retry-After': rateLimitResult.retryAfter.toString()
          }
        }
      );
    }
    
    // Check if this is a manual invocation or automated
    const isManual = req.method === 'POST';
    
    // Process the proxy bids
    const result = await processProxyBids();
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: result.processed,
        skipped: result.skipped,
        errors: result.errors,
        results: isManual ? result.results : undefined,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }, {
    module: 'proxy-bidding-processor',
    action: 'process'
  });
});

// Add a scheduled run for this function
// This is a commented example - cron jobs need to be set up in the database
// Deno.cron("process-proxy-bids", "*/15 * * * *", async () => {
//   console.log("Running scheduled proxy bid processing");
//   try {
//     await processProxyBids();
//   } catch (err) {
//     console.error("Error in scheduled proxy bid processing:", err);
//   }
// });
