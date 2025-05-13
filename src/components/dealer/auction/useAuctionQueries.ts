
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
      const auctionIds = (auctions || [])
        .filter(a => a !== null)
        .map(a => a?.id)
        .filter(Boolean);
        
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
          const bidsByCarId = (bidsData || []).reduce((acc: Record<string, any>, bid) => {
            if (!bid || !bid.car_id) return acc;
            if (!acc[bid.car_id] || (bid.amount || 0) > (acc[bid.car_id].amount || 0)) {
              acc[bid.car_id] = bid;
            }
            return acc;
          }, {});
          
          dealerBids = Object.values(bidsByCarId);
        }
      }

      // Format the auctions with proper type handling
      return (auctions || [])
        .filter(auction => auction !== null)
        .map((auction) => {
          if (!auction) return {} as Auction;
          
          const dealerBid = dealerBids.find(bid => bid?.car_id === auction.id);
          const currentBid = auction.current_bid || 0;
          const isOutbid = dealerBid && currentBid > (dealerBid.amount || 0);
          
          return {
            id: auction.id,
            title: auction.title || '',
            make: auction.make || '',
            model: auction.model || '',
            year: auction.year || 0,
            mileage: auction.mileage || 0,
            price: auction.price || 0,
            auction_end_time: auction.auction_end_time,
            auction_status: auction.auction_status || '',
            current_bid: currentBid,
            reserve_price: auction.reserve_price || 0,
            reserve_met: currentBid >= (auction.reserve_price || 0),
            my_bid: dealerBid ? {
              amount: dealerBid.amount || 0,
              status: isOutbid ? 'outbid' : 'active'
            } : undefined,
            highest_bid: currentBid ? {
              amount: currentBid,
              dealer_id: '' // We don't have this info without a join
            } : undefined
          } as Auction;
        })
        .filter(item => Object.keys(item).length > 0) as Auction[];
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
      const carIds = (soldCars || [])
        .filter(car => car !== null)
        .map(car => car?.id)
        .filter(Boolean);
        
      let winningBids: any[] = [];
      
      if (carIds.length > 0) {
        const { data: bidsData } = await supabase
          .from("bids")
          .select("car_id, dealer_id, amount, status")
          .in("car_id", carIds)
          .eq("status", "active"); // Active bids are the winning bids
          
        winningBids = bidsData || [];
      }

      // Filter only auctions won by this dealer and transform data
      return (soldCars || [])
        .filter(car => {
          if (!car) return false;
          const winningBid = winningBids.find(bid => bid?.car_id === car.id);
          return winningBid && winningBid.dealer_id === dealerId;
        })
        .map(auction => {
          if (!auction) return {} as Auction;
          
          return {
            id: auction.id || '',
            title: auction.title || '',
            make: auction.make || '',
            model: auction.model || '',
            year: auction.year || 0,
            auction_end_time: auction.auction_end_time,
            auction_status: auction.auction_status || '',
            reserve_price: 0, // Not available without a join
            price: 0, // Not available without a join
            current_bid: auction.current_bid || 0,
            highest_bid: {
              amount: auction.current_bid || 0,
              dealer_id: dealerId
            },
            my_bid: {
              amount: auction.current_bid || 0,
              status: "won"
            }
          };
        })
        .filter(item => Object.keys(item).length > 0) as Auction[];
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
      const carIds = [...new Set(dealerBids
        .filter(bid => bid !== null && bid.car_id)
        .map(bid => bid?.car_id)
        .filter(Boolean))];
      
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
      const highestDealerBidsByCarId = (dealerBids || []).reduce((acc: Record<string, any>, bid) => {
        if (!bid?.car_id) return acc;
        if (!acc[bid.car_id] || (bid.amount || 0) > (acc[bid.car_id].amount || 0)) {
          acc[bid.car_id] = bid;
        }
        return acc;
      }, {});
      
      // Find winning bids for these cars
      const { data: winningBids } = await supabase
        .from("bids")
        .select("car_id, dealer_id, amount")
        .in("car_id", (soldCars || [])
          .filter(car => car !== null)
          .map(car => car?.id)
          .filter(Boolean))
        .eq("status", "active"); // Active bids are the winning bids
      
      const winningBidsByCarId = (winningBids || []).reduce((acc: Record<string, any>, bid) => {
        if (!bid?.car_id) return acc;
        acc[bid.car_id] = bid;
        return acc;
      }, {});
      
      // Filter only auctions the dealer lost and transform data
      return (soldCars || [])
        .filter(car => {
          if (!car) return false;
          const winningBid = winningBidsByCarId[car.id];
          return winningBid && winningBid.dealer_id !== dealerId;
        })
        .map(auction => {
          if (!auction) return {} as Auction;
          
          const dealerBid = auction.id ? highestDealerBidsByCarId[auction.id] : null;
          return {
            id: auction.id || '',
            title: auction.title || '',
            make: auction.make || '',
            model: auction.model || '',
            year: auction.year || 0,
            auction_end_time: auction.auction_end_time,
            auction_status: auction.auction_status || '',
            reserve_price: 0, // Not available without a join
            price: 0, // Not available without a join
            current_bid: auction.current_bid || 0,
            highest_bid: {
              amount: auction.current_bid || 0,
              dealer_id: '' // We don't have the winner's dealer_id
            },
            my_bid: {
              amount: dealerBid?.amount || 0,
              status: "lost"
            },
            lost_by: (auction.current_bid || 0) - (dealerBid?.amount || 0)
          } as Auction;
        })
        .filter(item => Object.keys(item).length > 0) as Auction[];
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
