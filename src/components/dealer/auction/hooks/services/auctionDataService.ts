import { supabase } from "@/integrations/supabase/client";
import { AuctionFilters, Auction } from "../../types";
import { isValidRecord, isSelectQueryError, isValidBid, safelyFilterData } from "@/utils/supabaseHelpers";
import { decodeCursor, getCursorOperator } from "@/utils/cursorPagination";
import { calculateAuctionTimingStatus } from "../utils/auctionTimingUtils";
import { CarData, BidData } from "../types/auctionBrowserTypes";

const PAGE_SIZE = 10;

export const buildAuctionQuery = (
  filters: AuctionFilters,
  searchQuery: string,
  sortField: string,
  sortDirection: 'asc' | 'desc',
  cursor: string | null,
  direction: 'next' | 'prev'
) => {
  // Use consistent Supabase client for proper JWT token forwarding
  let query = supabase
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
      is_auction,
      auction_status,
      fuel_type,
      seat_material,
      transmission,
      vin,
      images,
      features,
      service_history_type,
      has_service_history,
      is_damaged,
      is_registered_in_poland,
      has_private_plate,
      finance_amount,
      address,
      seller_name,
      mobile_number,
      seller_notes,
      auction_schedules!inner(
        id,
        status,
        start_time,
        end_time,
        is_manually_controlled
      )
    `)
    // Show ALL auction schedules (active, scheduled, and recently completed)
    .in('auction_schedules.status', ['active', 'scheduled', 'completed']);

  // Apply additional time-based filtering for completed auctions only
  // Active auctions should always show regardless of time
  // For completed auctions, only show those that ended within the last 24 hours
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  // This query logic: show active auctions OR completed auctions that ended recently
  query = query.or(
    `auction_schedules.status.eq.active,auction_schedules.status.eq.scheduled,and(auction_schedules.status.eq.completed,auction_schedules.end_time.gte.${twentyFourHoursAgo})`
  );

  // Apply search
  if (searchQuery) {
    query = query.or(`make.ilike.%${searchQuery}%,model.ilike.%${searchQuery}%,title.ilike.%${searchQuery}%`);
  }

  // Apply filters
  if (filters.make) {
    query = query.ilike("make", `%${filters.make}%`);
  }
  
  if (filters.model) {
    query = query.ilike("model", `%${filters.model}%`);
  }
  
  if (filters.yearMin) {
    query = query.gte("year", filters.yearMin);
  }
  
  if (filters.yearMax) {
    query = query.lte("year", filters.yearMax);
  }
  
  if (filters.priceMin) {
    query = query.gte("price", filters.priceMin);
  }
  
  if (filters.priceMax) {
    query = query.lte("price", filters.priceMax);
  }
  
  if (filters.mileageMin) {
    query = query.gte("mileage", filters.mileageMin);
  }
  
  if (filters.mileageMax) {
    query = query.lte("mileage", filters.mileageMax);
  }

  // Apply cursor-based pagination if cursor is provided
  if (cursor) {
    const decodedCursor = decodeCursor(cursor);
    if (decodedCursor && decodedCursor.field === sortField) {
      const operator = getCursorOperator(direction, sortDirection);
      query = query.filter(`${sortField}`, operator, decodedCursor.value);
    }
  }

  // Apply sorting
  query = query.order(sortField, { ascending: sortDirection === 'asc' });
  
  // Limit results to PAGE_SIZE + 1 (extra item to check if there are more pages)
  query = query.limit(PAGE_SIZE + 1);

  return query;
};

export const fetchDealerBids = async (dealerId: string, auctionIds: string[]): Promise<BidData[]> => {
  if (auctionIds.length === 0) {
    return [];
  }

  // Use consistent Supabase client
  const { data: bidsData } = await supabase
    .from("bids")
    .select("car_id, amount, status")
    .eq("dealer_id", dealerId)
    .in("car_id", auctionIds)
    .order('amount', { ascending: false });
    
  if (!bidsData) {
    return [];
  }

  // Filter valid bids
  const validBids = safelyFilterData(bidsData, isValidBid);
  
  // Group bids by car_id and get the highest bid for each car
  const bidsByCarId = validBids.reduce((acc: Record<string, BidData>, bid) => {
    if (!bid || !bid.car_id) return acc;
    if (!acc[bid.car_id] || (bid.amount || 0) > (acc[bid.car_id].amount || 0)) {
      acc[bid.car_id] = bid;
    }
    return acc;
  }, {});
  
  return Object.values(bidsByCarId);
};

export const processAuctionData = (auctionData: any[]): CarData[] => {
  // Process the data to extract schedule information
  const processedData = auctionData.map(item => {
    const scheduleInfo = Array.isArray(item.auction_schedules) 
      ? item.auction_schedules[0] 
      : item.auction_schedules;
    
    return {
      ...item,
      schedule_status: scheduleInfo?.status,
      schedule_start_time: scheduleInfo?.start_time,
      schedule_end_time: scheduleInfo?.end_time,
      is_manually_controlled: scheduleInfo?.is_manually_controlled
    };
  });

  // Filter and cast data to proper type
  return processedData
    .filter(item => isValidRecord<CarData>(item) && !isSelectQueryError(item)) as CarData[];
};

export const formatAuctionData = (auctionData: CarData[], dealerBids: BidData[]): Auction[] => {
  const now = new Date();
  
  return auctionData
    .map((auction) => {
      if (!auction || !auction.id) return null;
      
      const dealerBid = dealerBids.find(bid => bid && bid.car_id === auction.id);
      const currentBid = auction.current_bid || 0;
      const reservePrice = auction.reserve_price || 0;
      
      // Check if this auction's current_bid is higher than the dealer's bid
      const isOutbid = dealerBid && currentBid > (dealerBid.amount || 0);
      
      // Calculate auction timing status using ONLY time-based calculation
      const auctionTimingStatus = calculateAuctionTimingStatus(
        auction.schedule_start_time,
        auction.schedule_end_time,
        auction.schedule_status
      );
      
      // Determine if bidding is allowed (only for active auctions)
      const biddingAllowed = auctionTimingStatus === 'active';
      
      // Calculate time until start/end for UX
      const startTime = auction.schedule_start_time ? new Date(auction.schedule_start_time) : null;
      const endTime = auction.schedule_end_time ? new Date(auction.schedule_end_time) : null;
      
      let timeDisplay = '';
      if (auctionTimingStatus === 'scheduled' && startTime) {
        const timeToStart = Math.max(0, startTime.getTime() - now.getTime());
        const hours = Math.floor(timeToStart / (1000 * 60 * 60));
        const minutes = Math.floor((timeToStart % (1000 * 60 * 60)) / (1000 * 60));
        timeDisplay = `Starts in ${hours}h ${minutes}m`;
      } else if (auctionTimingStatus === 'active' && endTime) {
        const timeToEnd = Math.max(0, endTime.getTime() - now.getTime());
        const hours = Math.floor(timeToEnd / (1000 * 60 * 60));
        const minutes = Math.floor((timeToEnd % (1000 * 60 * 60)) / (1000 * 60));
        timeDisplay = `Ends in ${hours}h ${minutes}m`;
      } else if (auctionTimingStatus === 'ended') {
        timeDisplay = 'Auction ended';
      }
      
      console.log('Auction timing calculation:', {
        carId: auction.id,
        make: auction.make,
        model: auction.model,
        auctionTimingStatus,
        biddingAllowed,
        timeDisplay,
        scheduleStatus: auction.schedule_status
      });
      
      return {
        id: auction.id,
        title: auction.title || '',
        make: auction.make || '',
        model: auction.model || '',
        year: auction.year || 0,
        mileage: auction.mileage || 0,
        price: auction.price || 0,
        auction_end_time: auction.schedule_end_time || auction.auction_end_time, // Use schedule end time
        auction_status: auctionTimingStatus === 'active' ? 'active' : auctionTimingStatus === 'ended' ? 'ended' : 'scheduled',
        current_bid: currentBid,
        reserve_price: reservePrice,
        my_bid: dealerBid ? {
          amount: dealerBid.amount || 0,
          status: isOutbid ? 'outbid' : 'active',
          car_id: auction.id
        } : undefined,
        highest_bid: currentBid ? {
          amount: currentBid,
          dealer_id: ''
        } : undefined,
        reserve_met: currentBid >= reservePrice,
        // Auction schedule information
        schedule_status: auction.schedule_status,
        schedule_start_time: auction.schedule_start_time,
        schedule_end_time: auction.schedule_end_time,
        is_manually_controlled: auction.is_manually_controlled,
        auctionTimingStatus: auctionTimingStatus,
        auction_timing_status: auctionTimingStatus,
        biddingAllowed,
        timeDisplay
      } as Auction;
    })
    .filter((item): item is Auction => item !== null)
    // Sort to prioritize live auctions, then starting soon, then scheduled
    .sort((a, b) => {
      const priorityOrder = { active: 0, scheduled: 1, ended: 2, unknown: 3 };
      return priorityOrder[a.auctionTimingStatus] - priorityOrder[b.auctionTimingStatus];
    });
};
