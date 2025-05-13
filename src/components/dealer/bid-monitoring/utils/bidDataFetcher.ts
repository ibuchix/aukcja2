
import { supabase } from "@/integrations/supabase/client";
import { BidActivity, BidMetrics } from "../types";
import { asArray, isValidRecord } from "@/utils/supabaseHelpers";

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

  // Ensure we have valid bids data
  const bids = (bidsData || []).filter(bid => 
    bid && 
    typeof bid === 'object' && 
    'car_id' in bid
  );

  // Extract car IDs safely
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
        created_at,
        updated_at,
        dealers:dealer_id(dealership_name),
        car:car_id(title, make, model, year, auction_end_time)
      `)
      .in("car_id", carIds)
      .order("created_at", { ascending: false });

    if (allBidsError) throw allBidsError;
    allBids = allBidsData || [];
  }

  // Fetch proxy bid executions from audit logs
  let proxyLogs: any[] = [];
  if (carIds.length > 0) {
    const { data: proxyLogsData, error: proxyLogsError } = await supabase
      .from("audit_logs")
      .select("*")
      .in("entity_id", carIds)
      .eq("action", "auto_proxy_bid")
      .order("created_at", { ascending: false });

    if (proxyLogsError) throw proxyLogsError;
    proxyLogs = proxyLogsData || [];
  }

  // Transform the data into a unified activity timeline
  const activities: BidActivity[] = [
    // Map regular bids to activities, filtering out invalid entries
    ...allBids
      .filter(bid => bid && typeof bid === 'object' && 'id' in bid)
      .map(bid => {
        const car = bid.car || {};
        const dealer = bid.dealers || {};
        
        return {
          id: `bid-${bid.id}`,
          timestamp: bid.created_at,
          type: 'new_bid' as const,
          carId: bid.car_id,
          carTitle: car?.title || `${car?.year || ''} ${car?.make || ''} ${car?.model || ''}`.trim() || 'Unknown Car',
          bidAmount: bid.amount || 0,
          bidId: bid.id,
          dealerId: bid.dealer_id,
          dealerName: dealer?.dealership_name || "Unknown Dealer",
          auctionEndTime: car?.auction_end_time,
          isOwnActivity: bid.dealer_id === dealerId
        };
      }),
    
    // Map proxy bid logs to activities, filtering out invalid entries
    ...proxyLogs
      .filter(log => log && typeof log === 'object' && 'id' in log)
      .map(log => {
        const details = (log.details as Record<string, any>) || {};
        
        return {
          id: `proxy-${log.id}`,
          timestamp: log.created_at,
          type: 'proxy_executed' as const,
          carId: log.entity_id,
          carTitle: "Car", // We'll need to fetch this separately
          bidAmount: details?.result?.amount || 0,
          bidId: details?.result?.bid_id,
          dealerId: log.user_id,
          isOwnActivity: log.user_id === dealerId
        };
      })
  ];

  // Sort activities by timestamp (newest first)
  activities.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // Calculate metrics from valid bids only
  const validBids = bids.filter(bid => bid && typeof bid === 'object' && 'status' in bid);
  
  const activeBids = validBids.filter(bid => bid.status === 'active');
  const outbidBids = validBids.filter(bid => bid.status === 'outbid');
  const wonBids = validBids.filter(bid => bid.status === 'won');
  const lostBids = validBids.filter(bid => bid.status === 'lost');

  const calculatedMetrics: BidMetrics = {
    activeBidsCount: activeBids.length,
    outbidCount: outbidBids.length,
    wonCount: wonBids.length,
    lostCount: lostBids.length,
    totalInvested: activeBids.reduce((sum, bid) => sum + (Number(bid.amount) || 0), 0),
    potentialExposure: activeBids.reduce((sum, bid) => sum + (Number(bid.amount) || 0), 0)
  };

  return { activities, calculatedMetrics };
}
