
import { supabase } from "@/integrations/supabase/client";
import { BidActivity, BidMetrics } from "../types";
import { isValidRecord, safeFilter, isSelectQueryError } from "@/utils/supabaseHelpers";

// Type definitions for data from database
interface DbBid {
  id: string;
  car_id: string;
  amount: number;
  status: string;
  created_at: string;
  car?: DbCar;
}

interface DbCar {
  id: string;
  title?: string;
  make?: string;
  model?: string;
  year?: number;
  auction_end_time?: string;
  current_bid?: number;
  auction_status?: string;
}

// Type guards
function isValidDbBid(item: any): item is DbBid {
  return item !== null && 
    typeof item === 'object' && 
    !isSelectQueryError(item) &&
    'car_id' in item &&
    'amount' in item &&
    'status' in item;
}

function isValidDbCar(item: any): item is DbCar {
  return item !== null && 
    typeof item === 'object' && 
    !isSelectQueryError(item) &&
    'id' in item &&
    'make' in item &&
    'model' in item;
}

function isValidBidWithCar(item: any): item is DbBid & { car: DbCar } {
  return isValidDbBid(item) && 
    'car' in item && 
    item.car && 
    typeof item.car === 'object' && 
    !isSelectQueryError(item.car) && 
    isValidDbCar(item.car);
}

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
  const bids = Array.isArray(bidsData) 
    ? bidsData.filter(isValidBidWithCar)
    : [];

  // Extract car IDs safely, filtering out any errors or invalid values
  const carIds = bids
    .map(bid => bid.car_id)
    .filter((id): id is string => typeof id === 'string');

  // Fetch bid history for cars the dealer has bid on
  let allBids: DbBid[] = [];
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
    allBids = Array.isArray(allBidsData) 
      ? allBidsData.filter(isValidDbBid)
      : [];
  }

  // Activities - combine bid info with car info
  const activities: BidActivity[] = [];
  
  for (const bid of bids) {
    const car = bid.car;
    
    if (car) {
      activities.push({
        id: bid.id,
        carId: bid.car_id,
        carTitle: car.title || `${car.year} ${car.make} ${car.model}`,
        amount: bid.amount,
        timestamp: bid.created_at,
        type: 'new_bid',
        isOwnActivity: true,
        bidId: bid.id,
        dealerId: dealerId,
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

function calculateBidMetrics(dealerId: string, dealerBids: DbBid[], allBids: DbBid[]): BidMetrics {
  // Filter to ensure we have valid data before calculations
  const validDealerBids = dealerBids.filter(isValidDbBid);
  const validAllBids = allBids.filter(isValidDbBid);

  const metrics: BidMetrics = {
    activeBidsCount: validDealerBids.filter(bid => bid.status === 'active').length,
    outbidCount: validDealerBids.filter(bid => bid.status === 'outbid').length,
    wonCount: validDealerBids.filter(bid => bid.status === 'won').length,
    lostCount: validDealerBids.filter(bid => bid.status === 'lost').length,
    totalInvested: validDealerBids
      .filter(bid => bid.status === 'active')
      .reduce((sum, bid) => sum + (bid.amount || 0), 0),
    potentialExposure: validDealerBids
      .filter(bid => bid.status === 'active')
      .reduce((sum, bid) => sum + (bid.amount || 0), 0)
  };

  return metrics;
}
