
import { supabase } from "@/integrations/supabase/client";
import { BidActivity, BidMetrics } from "../types";

export async function fetchInitialBidData(dealerId: string): Promise<{
  activities: BidActivity[];
  calculatedMetrics: BidMetrics;
}> {
  // Fetch dealer's bids
  const { data: bids, error: bidsError } = await supabase
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

  // Fetch bid history for cars the dealer has bid on
  const carIds = bids.map(bid => bid.car_id);
  const { data: allBids, error: allBidsError } = await supabase
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

  // Fetch proxy bid executions from audit logs
  const { data: proxyLogs, error: proxyLogsError } = await supabase
    .from("audit_logs")
    .select("*")
    .in("entity_id", carIds)
    .eq("action", "auto_proxy_bid")
    .order("created_at", { ascending: false });

  if (proxyLogsError) throw proxyLogsError;

  // Transform the data into a unified activity timeline
  const activities: BidActivity[] = [
    // Map regular bids to activities
    ...allBids.map(bid => ({
      id: `bid-${bid.id}`,
      timestamp: bid.created_at,
      type: 'new_bid' as const,
      carId: bid.car_id,
      carTitle: bid.car?.title || `${bid.car?.year} ${bid.car?.make} ${bid.car?.model}`,
      bidAmount: bid.amount,
      bidId: bid.id,
      dealerId: bid.dealer_id,
      dealerName: bid.dealers?.dealership_name || "Unknown Dealer",
      auctionEndTime: bid.car?.auction_end_time,
      isOwnActivity: bid.dealer_id === dealerId
    })),
    
    // Map proxy bid logs to activities
    ...proxyLogs.map(log => {
      const details = log.details as Record<string, any> | null;
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

  // Calculate metrics
  const activeBids = bids.filter(bid => bid.status === 'active');
  const outbidBids = bids.filter(bid => bid.status === 'outbid');
  const wonBids = bids.filter(bid => bid.status === 'won');
  const lostBids = bids.filter(bid => bid.status === 'lost');

  const calculatedMetrics: BidMetrics = {
    activeBidsCount: activeBids.length,
    outbidCount: outbidBids.length,
    wonCount: wonBids.length,
    lostCount: lostBids.length,
    totalInvested: activeBids.reduce((sum, bid) => sum + (bid.amount || 0), 0),
    potentialExposure: activeBids.reduce((sum, bid) => sum + (bid.amount || 0), 0)
  };

  return { activities, calculatedMetrics };
}
