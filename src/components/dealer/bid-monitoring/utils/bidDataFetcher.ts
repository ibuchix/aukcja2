
import { supabase } from "@/integrations/supabase/client";
import { BidActivity, BidMetrics } from "../types";
import { isValidRecord, safeFilter, isSelectQueryError } from "@/utils/supabaseHelpers";

export async function fetchInitialBidData(dealerId: string): Promise<{
  activities: BidActivity[];
  calculatedMetrics: BidMetrics;
}> {
  // Fetch dealer's bids
  const { data: bidsData, error: bidsError } = await supabase
    .from("bids")
    .select(`
      id,
      car_id,
      amount,
      status,
      created_at,
      car:cars(
        id,
        title,
        make,
        model,
        year,
        auction_end_time,
        current_bid,
        auction_status
      )
    `)
    .eq("dealer_id", dealerId)
    .order("created_at", { ascending: false });

  if (bidsError) throw bidsError;

  // Ensure we have valid bids data - filter out nulls and errors
  const bids = (bidsData || []).filter(bid => 
    bid !== null && 
    typeof bid === 'object' && 
    !isSelectQueryError(bid) &&
    'car_id' in bid
  );

  // Extract car IDs safely, filtering out any errors or invalid values
  const carIds = bids
    .map(bid => bid?.car_id)
    .filter((id): id is string => typeof id === 'string');

  // Fetch bid history for cars the dealer has bid on
  let allBids: any[] = [];
  if (carIds.length > 0) {
    const { data: allBidsData, error: allBidsError } = await supabase
      .from("bids")
      .select(`
        id,
        car_id,
        dealer_id,
        amount,
        status,
        created_at
      `)
      .in("car_id", carIds)
      .order("created_at", { ascending: false });

    if (allBidsError) throw allBidsError;
    
    // Filter to ensure we have valid bid data
    allBids = (allBidsData || []).filter(bid => 
      bid !== null && 
      typeof bid === 'object' && 
      !isSelectQueryError(bid) &&
      'car_id' in bid &&
      'amount' in bid &&
      'status' in bid
    );
  }

  // Activities - combine bid info with car info
  const activities: BidActivity[] = [];
  
  for (const bid of bids) {
    // Skip invalid bids
    if (!bid || !bid.car || isSelectQueryError(bid.car)) continue;
    
    const car = bid.car;
    
    // Only process if car data is valid
    if (car && typeof car === 'object' && !isSelectQueryError(car)) {
      activities.push({
        id: bid.id,
        car_id: bid.car_id,
        car_title: car.title || `${car.year} ${car.make} ${car.model}`,
        amount: bid.amount,
        created_at: bid.created_at,
        status: bid.status || 'active',
        is_winning: car.current_bid === bid.amount,
        auction_ends: car.auction_end_time,
        car_details: {
          make: car.make,
          model: car.model,
          year: car.year
        }
      });
    }
  }

  // Calculate metrics
  const calculatedMetrics = calculateBidMetrics(dealerId, bids, allBids);

  return {
    activities,
    calculatedMetrics
  };
}

function calculateBidMetrics(dealerId: string, dealerBids: any[], allBids: any[]): BidMetrics {
  // Filter to ensure we have valid data before calculations
  const validDealerBids = dealerBids.filter(bid => 
    bid !== null && 
    typeof bid === 'object' && 
    !isSelectQueryError(bid) &&
    'amount' in bid &&
    'status' in bid
  );
  
  const validAllBids = allBids.filter(bid => 
    bid !== null && 
    typeof bid === 'object' && 
    !isSelectQueryError(bid) &&
    'amount' in bid &&
    'status' in bid &&
    'dealer_id' in bid
  );

  const metrics: BidMetrics = {
    totalBids: validDealerBids.length,
    activeBids: validDealerBids.filter(bid => bid.status === 'active').length,
    wonBids: validDealerBids.filter(bid => bid.status === 'won').length,
    outbidBids: validDealerBids.filter(bid => bid.status === 'outbid').length,
    lostBids: validDealerBids.filter(bid => bid.status === 'lost').length,
    bidSuccess: 0,
    averageBidAmount: 0,
    bidFrequency: 0
  };

  // Calculate additional metrics
  if (metrics.totalBids > 0) {
    // Calculate average bid amount
    const totalAmount = validDealerBids.reduce((sum, bid) => sum + (bid.amount || 0), 0);
    metrics.averageBidAmount = totalAmount / metrics.totalBids;

    // Calculate bid success rate
    if (metrics.wonBids + metrics.lostBids > 0) {
      metrics.bidSuccess = (metrics.wonBids / (metrics.wonBids + metrics.lostBids)) * 100;
    }
  }

  // Calculate bid frequency (bids per day)
  if (validDealerBids.length > 1) {
    const sortedBids = [...validDealerBids].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    
    const firstBid = sortedBids[0];
    const lastBid = sortedBids[sortedBids.length - 1];
    
    if (firstBid && lastBid && firstBid.created_at && lastBid.created_at) {
      const firstDate = new Date(firstBid.created_at);
      const lastDate = new Date(lastBid.created_at);
      const daysDiff = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysDiff > 0) {
        metrics.bidFrequency = validDealerBids.length / daysDiff;
      } else {
        metrics.bidFrequency = validDealerBids.length; // All bids in less than a day
      }
    }
  }

  return metrics;
}
