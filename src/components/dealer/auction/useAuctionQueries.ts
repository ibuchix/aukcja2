
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Auction } from "./types";

export const useAuctionQueries = (dealerId: string) => {
  const { data: activeAuctions, isLoading: loadingActive } = useQuery({
    queryKey: ["activeAuctions", dealerId],
    queryFn: async () => {
      const { data: auctions, error } = await supabase
        .from("cars")
        .select(`
          id,
          title,
          auction_end_time,
          auction_status,
          reserve_price,
          price,
          make,
          model,
          year,
          mileage,
          current_bid,
          highest_bid:bids(amount, dealer_id)
        `)
        .eq("is_auction", true)
        .eq("auction_status", "active")
        .order("auction_end_time", { ascending: true });

      if (error) throw error;

      // Get dealer's bids for these auctions
      const auctionIds = auctions.map((a) => a.id);
      const { data: dealerBids } = await supabase
        .from("bids")
        .select("car_id, amount, status")
        .eq("dealer_id", dealerId)
        .in("car_id", auctionIds);

      return auctions.map((auction) => ({
        ...auction,
        highest_bid: auction.highest_bid?.[0],
        my_bid: dealerBids?.find((bid) => bid.car_id === auction.id),
      })) as Auction[];
    },
  });

  const { data: wonAuctions, isLoading: loadingWon } = useQuery({
    queryKey: ["wonAuctions", dealerId],
    queryFn: async () => {
      // First get winning bid car IDs
      const { data: winningBids } = await supabase
        .from("bids")
        .select("car_id")
        .eq("dealer_id", dealerId)
        .eq("status", "won");

      const winningCarIds = winningBids?.map(bid => bid.car_id) || [];

      const { data: auctions, error } = await supabase
        .from("cars")
        .select(`
          id,
          title,
          auction_end_time,
          auction_status,
          reserve_price,
          price,
          make,
          model,
          year,
          mileage,
          current_bid,
          highest_bid:bids(amount, dealer_id)
        `)
        .eq("is_auction", true)
        .eq("auction_status", "sold")
        .in("id", winningCarIds)
        .order("auction_end_time", { ascending: false });

      if (error) throw error;

      return auctions.map(auction => ({
        ...auction,
        highest_bid: auction.highest_bid?.[0]
      })) as Auction[];
    },
  });

  const { data: lostAuctions, isLoading: loadingLost } = useQuery({
    queryKey: ["lostAuctions", dealerId],
    queryFn: async () => {
      const { data: auctions, error } = await supabase
        .from("cars")
        .select(`
          id,
          title,
          auction_end_time,
          auction_status,
          reserve_price,
          price,
          make,
          model,
          year,
          mileage,
          current_bid,
          highest_bid:bids(amount, dealer_id),
          my_bid:bids!inner(amount, status)
        `)
        .eq("is_auction", true)
        .eq("auction_status", "sold")
        .eq("bids.dealer_id", dealerId)
        .eq("bids.status", "lost")
        .order("auction_end_time", { ascending: false });

      if (error) throw error;

      return auctions.map(auction => ({
        ...auction,
        highest_bid: auction.highest_bid?.[0],
        my_bid: auction.my_bid?.[0],
        lost_by: auction.highest_bid?.[0]?.amount - auction.my_bid?.[0]?.amount
      })) as Auction[];
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
