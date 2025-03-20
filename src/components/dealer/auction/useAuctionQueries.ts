
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Auction } from "./types";

export const useAuctionQueries = (dealerId: string) => {
  // Query for active auctions 
  const { data: activeAuctions, isLoading: loadingActive } = useQuery({
    queryKey: ["activeAuctions", dealerId],
    queryFn: async () => {
      // Get active auctions
      const { data: auctions, error } = await supabase
        .from("cars")
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
          auction_status
        `)
        .eq("auction_status", "active")
        .eq("is_auction", true)
        .eq("is_draft", false)
        .order("auction_end_time", { ascending: true });

      if (error) throw error;

      // Get dealer's bids for these auctions
      const auctionIds = auctions.map((a) => a.id);
      let dealerBids: any[] = [];
      
      if (auctionIds.length > 0) {
        const { data: bidsData } = await supabase
          .from("bids")
          .select("car_id, amount, status")
          .eq("dealer_id", dealerId)
          .in("car_id", auctionIds)
          .order('amount', { ascending: false });
          
        if (bidsData) {
          // Group bids by car_id and get the highest bid for each car
          const bidsByCarId = bidsData.reduce((acc: Record<string, any>, bid) => {
            if (!acc[bid.car_id] || bid.amount > acc[bid.car_id].amount) {
              acc[bid.car_id] = bid;
            }
            return acc;
          }, {});
          
          dealerBids = Object.values(bidsByCarId);
        }
      }

      return auctions.map((auction) => {
        const dealerBid = dealerBids.find(bid => bid.car_id === auction.id);
        const isOutbid = dealerBid && auction.current_bid > dealerBid.amount;
        return {
          ...auction,
          reserve_met: auction.current_bid >= auction.reserve_price,
          my_bid: dealerBid ? {
            amount: dealerBid.amount,
            status: isOutbid ? 'outbid' : 'active'
          } : undefined,
          highest_bid: auction.current_bid ? {
            amount: auction.current_bid,
            dealer_id: '' // We don't have this info without a join
          } : undefined
        };
      }) as Auction[];
    },
  });

  // Query for won auctions
  const { data: wonAuctions, isLoading: loadingWon } = useQuery({
    queryKey: ["wonAuctions", dealerId],
    queryFn: async () => {
      // Find cars that the dealer won (highest bid belongs to dealer and auction is sold)
      const { data: soldCars, error } = await supabase
        .from("cars")
        .select(`
          id,
          title,
          make,
          model,
          year,
          auction_end_time,
          current_bid,
          auction_status
        `)
        .eq("auction_status", "sold")
        .order("auction_end_time", { ascending: false });

      if (error) throw error;

      // Find the winning bids for these cars
      const carIds = soldCars.map(car => car.id);
      let winningBids: any[] = [];
      
      if (carIds.length > 0) {
        const { data: bidsData } = await supabase
          .from("bids")
          .select("car_id, dealer_id, amount, status")
          .in("car_id", carIds)
          .eq("status", "active"); // Active bids are the winning bids
          
        winningBids = bidsData || [];
      }

      // Filter only auctions won by this dealer
      return soldCars
        .filter(car => {
          const winningBid = winningBids.find(bid => bid.car_id === car.id);
          return winningBid && winningBid.dealer_id === dealerId;
        })
        .map(auction => ({
          id: auction.id,
          title: auction.title,
          make: auction.make,
          model: auction.model,
          year: auction.year,
          auction_end_time: auction.auction_end_time,
          auction_status: auction.auction_status,
          reserve_price: 0, // Not available without a join
          price: 0, // Not available without a join
          current_bid: auction.current_bid,
          highest_bid: {
            amount: auction.current_bid,
            dealer_id: dealerId
          },
          my_bid: {
            amount: auction.current_bid,
            status: "won"
          }
        })) as Auction[];
    },
  });

  // Query for lost auctions
  const { data: lostAuctions, isLoading: loadingLost } = useQuery({
    queryKey: ["lostAuctions", dealerId],
    queryFn: async () => {
      // First get all bids from this dealer
      const { data: dealerBids, error: bidsError } = await supabase
        .from("bids")
        .select(`
          car_id,
          amount,
          status
        `)
        .eq("dealer_id", dealerId);
      
      if (bidsError) throw bidsError;
      
      if (!dealerBids || dealerBids.length === 0) {
        return [] as Auction[];
      }
      
      // Get unique car IDs that the dealer has bid on
      const carIds = [...new Set(dealerBids.map(bid => bid.car_id))];
      
      // Get sold cars that the dealer has bid on
      const { data: soldCars, error: carsError } = await supabase
        .from("cars")
        .select(`
          id,
          title,
          make,
          model,
          year,
          auction_end_time,
          current_bid,
          auction_status
        `)
        .in("id", carIds)
        .eq("auction_status", "sold")
        .order("auction_end_time", { ascending: false });
      
      if (carsError) throw carsError;
      
      // Find highest bid for each car from this dealer
      const highestDealerBidsByCarId = dealerBids.reduce((acc: Record<string, any>, bid) => {
        if (!acc[bid.car_id] || bid.amount > acc[bid.car_id].amount) {
          acc[bid.car_id] = bid;
        }
        return acc;
      }, {});
      
      // Find winning bids for these cars
      const { data: winningBids } = await supabase
        .from("bids")
        .select("car_id, dealer_id, amount")
        .in("car_id", soldCars.map(car => car.id))
        .eq("status", "active"); // Active bids are the winning bids
      
      const winningBidsByCarId = (winningBids || []).reduce((acc: Record<string, any>, bid) => {
        acc[bid.car_id] = bid;
        return acc;
      }, {});
      
      // Filter only auctions the dealer lost
      return soldCars
        .filter(car => {
          const winningBid = winningBidsByCarId[car.id];
          return winningBid && winningBid.dealer_id !== dealerId;
        })
        .map(auction => {
          const dealerBid = highestDealerBidsByCarId[auction.id];
          return {
            id: auction.id,
            title: auction.title,
            make: auction.make,
            model: auction.model,
            year: auction.year,
            auction_end_time: auction.auction_end_time,
            auction_status: auction.auction_status,
            reserve_price: 0, // Not available without a join
            price: 0, // Not available without a join
            current_bid: auction.current_bid,
            highest_bid: {
              amount: auction.current_bid,
              dealer_id: '' // We don't have the winner's dealer_id
            },
            my_bid: {
              amount: dealerBid?.amount || 0,
              status: "lost"
            },
            lost_by: auction.current_bid - (dealerBid?.amount || 0)
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
