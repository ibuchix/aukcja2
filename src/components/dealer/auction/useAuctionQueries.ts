
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Auction } from "./types";

export const useAuctionQueries = (dealerId: string) => {
  // Query for active auctions using materialized view
  const { data: activeAuctions, isLoading: loadingActive } = useQuery({
    queryKey: ["activeAuctions", dealerId],
    queryFn: async () => {
      // Get active auctions from materialized view
      const { data: auctions, error } = await supabase
        .from("mv_active_auctions")
        .select(`
          id,
          title,
          auction_end_time,
          make,
          model,
          year,
          mileage,
          price,
          current_bid,
          reserve_price,
          reserve_met,
          bid_count,
          unique_bidders
        `)
        .order("auction_end_time", { ascending: true });

      if (error) throw error;

      // Get dealer's bids for these auctions from the materialized view
      const auctionIds = auctions.map((a) => a.id);
      const { data: dealerBids } = await supabase
        .from("mv_dealer_bids")
        .select("car_id, my_highest_bid, outbid")
        .eq("dealer_id", dealerId)
        .in("car_id", auctionIds);

      return auctions.map((auction) => {
        const dealerBid = dealerBids?.find(bid => bid.car_id === auction.id);
        return {
          ...auction,
          auction_status: 'active',
          my_bid: dealerBid ? {
            amount: dealerBid.my_highest_bid,
            status: dealerBid.outbid ? 'outbid' : 'active'
          } : undefined,
          highest_bid: auction.current_bid ? {
            amount: auction.current_bid,
            dealer_id: '' // We don't have this info in the materialized view
          } : undefined
        };
      }) as Auction[];
    },
  });

  // Query for won auctions using materialized view
  const { data: wonAuctions, isLoading: loadingWon } = useQuery({
    queryKey: ["wonAuctions", dealerId],
    queryFn: async () => {
      // Use the auction results materialized view to find won auctions
      const { data: auctions, error } = await supabase
        .from("mv_auction_results")
        .select(`
          car_id,
          title,
          make,
          model,
          year,
          auction_end_time,
          final_price,
          auction_status,
          total_bids,
          unique_bidders
        `)
        .eq("winning_dealer_id", dealerId)
        .eq("auction_status", "sold")
        .order("auction_end_time", { ascending: false });

      if (error) throw error;

      return auctions.map(auction => ({
        id: auction.car_id,
        title: auction.title,
        make: auction.make,
        model: auction.model,
        year: auction.year,
        auction_end_time: auction.auction_end_time,
        auction_status: auction.auction_status,
        reserve_price: 0, // Not available in the view
        price: 0, // Not available in the view
        current_bid: auction.final_price,
        highest_bid: {
          amount: auction.final_price,
          dealer_id: dealerId
        },
        my_bid: {
          amount: auction.final_price,
          status: "won"
        }
      })) as Auction[];
    },
  });

  // Query for lost auctions - we'll need to join data since the materialized view doesn't have dealer-specific loss info
  const { data: lostAuctions, isLoading: loadingLost } = useQuery({
    queryKey: ["lostAuctions", dealerId],
    queryFn: async () => {
      // First check dealer bids for cars that are sold but where dealer isn't the winner
      const { data: bidsCars, error: bidsError } = await supabase
        .from("bids")
        .select(`
          car_id,
          amount
        `)
        .eq("dealer_id", dealerId)
        .eq("status", "lost");
      
      if (bidsError) throw bidsError;
      
      if (!bidsCars || bidsCars.length === 0) {
        return [] as Auction[];
      }
      
      // Get the auction details from the materialized view
      const carIds = bidsCars.map(bid => bid.car_id);
      const { data: auctionResults, error: resultsError } = await supabase
        .from("mv_auction_results")
        .select(`
          car_id,
          title,
          make,
          model,
          year,
          auction_end_time,
          final_price,
          auction_status
        `)
        .in("car_id", carIds)
        .eq("auction_status", "sold")
        .order("auction_end_time", { ascending: false });
      
      if (resultsError) throw resultsError;
      
      return auctionResults.map(auction => {
        const dealerBid = bidsCars.find(bid => bid.car_id === auction.car_id);
        return {
          id: auction.car_id,
          title: auction.title,
          make: auction.make,
          model: auction.model,
          year: auction.year,
          auction_end_time: auction.auction_end_time,
          auction_status: auction.auction_status,
          reserve_price: 0, // Not available in the view
          price: 0, // Not available in the view
          current_bid: auction.final_price,
          highest_bid: {
            amount: auction.final_price,
            dealer_id: '' // Not the current dealer
          },
          my_bid: {
            amount: dealerBid?.amount || 0,
            status: "lost"
          },
          lost_by: auction.final_price - (dealerBid?.amount || 0)
        };
      }) as Auction[];
    },
  });

  return {
    activeAuctions,
    loadingActive,
    wonAuctions,
    loadingWon,
    lostAuctions,
    loadingLost,
  };
};
