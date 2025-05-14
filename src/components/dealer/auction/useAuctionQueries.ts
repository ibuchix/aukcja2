
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Auction } from "./types";
import { isValidRecord, isSelectQueryError, safeFilter, isValidBid } from "@/utils/supabaseHelpers";

interface CarData {
  id: string;
  title?: string;
  make?: string;
  model?: string;
  year?: number;
  mileage?: number;
  price?: number;
  auction_end_time?: string;
  auction_status?: string;
  current_bid?: number;
  reserve_price?: number;
}

interface BidData {
  car_id: string;
  dealer_id?: string;
  amount: number;
  status?: string;
}

export const useAuctionQueries = (dealerId: string) => {
  // Query for active auctions 
  const { data: activeAuctions, isLoading: loadingActive } = useQuery({
    queryKey: ["activeAuctions", dealerId],
    queryFn: async () => {
      // Get active auctions
      const { data: auctionsData, error } = await supabase
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

      // Filter and cast to proper type, ensuring no SelectQueryErrors
      const typedAuctions = (auctionsData || [])
        .filter(item => 
          item !== null && 
          typeof item === 'object' && 
          !isSelectQueryError(item) &&
          'id' in item
        ) as CarData[];

      // Get dealer's bids for these auctions
      const auctionIds = typedAuctions.map(a => a.id).filter(Boolean);
      let dealerBids: BidData[] = [];
      
      if (auctionIds.length > 0) {
        const { data: bidsData } = await supabase
          .from("bids")
          .select("car_id, amount, status")
          .eq("dealer_id", dealerId)
          .in("car_id", auctionIds)
          .order('amount', { ascending: false });
          
        if (bidsData && Array.isArray(bidsData)) {
          // Filter and cast to proper type, ensuring we don't include SelectQueryErrors
          dealerBids = bidsData.filter(bid => 
            bid !== null && 
            typeof bid === 'object' && 
            !isSelectQueryError(bid) &&
            'car_id' in bid && 
            'amount' in bid
          ) as BidData[];
          
          // Group bids by car_id and get the highest bid for each car
          const bidsByCarId = dealerBids.reduce((acc: Record<string, BidData>, bid) => {
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
      return typedAuctions
        .map((auction) => {
          if (!auction || !auction.id) return null;
          
          const dealerBid = dealerBids.find(bid => bid && bid.car_id === auction.id);
          const currentBid = auction.current_bid || 0;
          const reservePrice = auction.reserve_price || 0;
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
            reserve_price: reservePrice,
            reserve_met: currentBid >= reservePrice,
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
        .filter((auction): auction is Auction => auction !== null);
    },
  });

  // Query for won auctions
  const { data: wonAuctions, isLoading: loadingWon } = useQuery({
    queryKey: ["wonAuctions", dealerId],
    queryFn: async () => {
      // Find cars that the dealer won (highest bid belongs to dealer and auction is sold)
      const { data: soldCarsData, error } = await supabase
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

      // Filter and cast to proper type, removing SelectQueryErrors
      const typedSoldCars = (soldCarsData || [])
        .filter(item => 
          item !== null && 
          typeof item === 'object' && 
          !isSelectQueryError(item) &&
          'id' in item
        ) as CarData[];

      // Find the winning bids for these cars
      const carIds = typedSoldCars.map(car => car.id).filter(Boolean);
      let winningBids: BidData[] = [];
      
      if (carIds.length > 0) {
        const { data: bidsData } = await supabase
          .from("bids")
          .select("car_id, dealer_id, amount, status")
          .in("car_id", carIds)
          .eq("status", "active"); // Active bids are the winning bids
          
        // Filter and cast to proper type
        if (bidsData && Array.isArray(bidsData)) {
          winningBids = bidsData.filter(item => 
            item !== null && 
            typeof item === 'object' && 
            !isSelectQueryError(item) &&
            'car_id' in item &&
            'dealer_id' in item
          ) as BidData[];
        }
      }

      // Filter only auctions won by this dealer and transform data
      return typedSoldCars
        .filter(car => {
          if (!car || !car.id) return false;
          const winningBid = winningBids.find(bid => bid && bid.car_id === car.id);
          return winningBid && winningBid.dealer_id === dealerId;
        })
        .map(auction => {
          if (!auction || !auction.id) return null;
          
          return {
            id: auction.id,
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
          } as Auction;
        })
        .filter((auction): auction is Auction => auction !== null);
    },
  });

  // Query for lost auctions
  const { data: lostAuctions, isLoading: loadingLost } = useQuery({
    queryKey: ["lostAuctions", dealerId],
    queryFn: async () => {
      // First get all bids from this dealer
      const { data: dealerBidsData, error: bidsError } = await supabase
        .from("bids")
        .select(`
          car_id,
          amount,
          status
        `)
        .eq("dealer_id", dealerId);
      
      if (bidsError) throw bidsError;
      
      // Filter valid bids and extract car ids
      const validDealerBids = (dealerBidsData || [])
        .filter(bid => 
          bid !== null && 
          typeof bid === 'object' && 
          !isSelectQueryError(bid) &&
          'car_id' in bid
        ) as BidData[];
      
      if (validDealerBids.length === 0) {
        return [] as Auction[];
      }
      
      // Get unique car IDs that the dealer has bid on
      const carIds = [...new Set(validDealerBids
        .map(bid => bid?.car_id)
        .filter(Boolean))];
      
      // Get sold cars that the dealer has bid on
      const { data: soldCarsData, error: carsError } = await supabase
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
      
      // Filter and cast to proper type
      const typedSoldCars = (soldCarsData || [])
        .filter(item => 
          item !== null && 
          typeof item === 'object' && 
          !isSelectQueryError(item) &&
          'id' in item
        ) as CarData[];
      
      // Find highest bid for each car from this dealer
      const highestDealerBidsByCarId: Record<string, BidData> = {};
      
      validDealerBids.forEach(bid => {
        if (!bid?.car_id) return;
        if (!highestDealerBidsByCarId[bid.car_id] || (bid.amount || 0) > (highestDealerBidsByCarId[bid.car_id].amount || 0)) {
          highestDealerBidsByCarId[bid.car_id] = bid;
        }
      });
      
      // Find winning bids for these cars
      const { data: winningBidsData } = await supabase
        .from("bids")
        .select("car_id, dealer_id, amount")
        .in("car_id", typedSoldCars.map(car => car.id).filter(Boolean))
        .eq("status", "active"); // Active bids are the winning bids
      
      // Filter and cast to proper type
      const typedWinningBids: BidData[] = [];
      if (winningBidsData && Array.isArray(winningBidsData)) {
        winningBidsData.forEach(bid => {
          if (bid !== null && 
              typeof bid === 'object' && 
              !isSelectQueryError(bid) &&
              'car_id' in bid && 
              'dealer_id' in bid) {
            typedWinningBids.push(bid as BidData);
          }
        });
      }
      
      const winningBidsByCarId: Record<string, BidData> = {};
      
      typedWinningBids.forEach(bid => {
        if (!bid?.car_id) return;
        winningBidsByCarId[bid.car_id] = bid;
      });
      
      // Filter only auctions the dealer lost and transform data
      return typedSoldCars
        .filter(car => {
          if (!car || !car.id) return false;
          const winningBid = car.id ? winningBidsByCarId[car.id] : null;
          return winningBid && winningBid.dealer_id !== dealerId;
        })
        .map(auction => {
          if (!auction || !auction.id) return null;
          
          const dealerBid = auction.id ? highestDealerBidsByCarId[auction.id] : null;
          return {
            id: auction.id,
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
        .filter((auction): auction is Auction => auction !== null);
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
