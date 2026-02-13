import { supabase } from "@/integrations/supabase/client";
import { AuctionFilters, Auction } from "../../types";
import { isValidRecord, isSelectQueryError, isValidBid, safelyFilterData } from "@/utils/supabaseHelpers";
import { decodeCursor, getCursorOperator } from "@/utils/cursorPagination";
import { calculateAuctionTimingStatus } from "../utils/auctionTimingUtils";
import { CarData, BidData } from "../types/auctionBrowserTypes";
import { fetchCarFileUploads, type CarFileUpload } from "@/utils/imageUtils/carFileUploads";
import { getCountySearchPatterns } from "@/constants/countyVariants";

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
      town,
      county,
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
    const minYear = parseInt(filters.yearMin, 10);
    if (!isNaN(minYear)) {
      query = query.gte("year", minYear);
    }
  }
  
  if (filters.yearMax) {
    const maxYear = parseInt(filters.yearMax, 10);
    if (!isNaN(maxYear)) {
      query = query.lte("year", maxYear);
    }
  }
  
  if (filters.priceMin) {
    const minPrice = parseInt(filters.priceMin, 10);
    if (!isNaN(minPrice)) {
      query = query.gte("reserve_price", minPrice);
    }
  }
  
  if (filters.priceMax) {
    const maxPrice = parseInt(filters.priceMax, 10);
    if (!isNaN(maxPrice)) {
      query = query.lte("reserve_price", maxPrice);
    }
  }
  
  if (filters.mileageMin) {
    const minMileage = parseInt(filters.mileageMin, 10);
    if (!isNaN(minMileage)) {
      query = query.gte("mileage", minMileage);
    }
  }
  
  if (filters.mileageMax) {
    const maxMileage = parseInt(filters.mileageMax, 10);
    if (!isNaN(maxMileage)) {
      query = query.lte("mileage", maxMileage);
    }
  }

  if (filters.county) {
    const patterns = getCountySearchPatterns(filters.county);
    const orCondition = patterns
      .map(p => `county.ilike.%${p}%`)
      .join(',');
    query = query.or(orCondition);
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

export const formatAuctionData = async (auctionData: CarData[], dealerBids: BidData[], sortOption: string): Promise<Auction[]> => {
  console.log('🖼️ formatAuctionData starting to fetch file uploads for', auctionData.length, 'auctions');
  
  // Fetch car file uploads for all auction cars
  const carIds = auctionData.map(auction => auction.id).filter(Boolean);
  const carFileUploads = await fetchCarFileUploads(carIds);
  
  console.log('📸 Retrieved file uploads:', {
    totalUploads: carFileUploads.length,
    carIdsRequested: carIds.length,
    uploadsByCar: carFileUploads.reduce((acc, upload) => {
      acc[upload.car_id] = (acc[upload.car_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  });
  
  // Organize uploads by car_id
  const uploadsByCarId = carFileUploads.reduce((acc, upload) => {
    if (!acc[upload.car_id]) {
      acc[upload.car_id] = [];
    }
    acc[upload.car_id].push(upload);
    return acc;
  }, {} as Record<string, CarFileUpload[]>);
  
  const now = new Date();
  
  const formattedAuctions = auctionData
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
      
      // Get file uploads for this car
      const fileUploads = uploadsByCarId[auction.id] || [];
      
      console.log('🖼️ Car file uploads for', auction.make, auction.model, ':', {
        carId: auction.id,
        uploadsFound: fileUploads.length,
        uploads: fileUploads.map(u => ({ category: u.category, file_path: u.file_path }))
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
        town: auction.town,
        county: auction.county,
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
        timeDisplay,
        // Add file uploads for images
        fileUploads: fileUploads
      } as Auction;
    })
    .filter((item): item is Auction => item !== null);

  // Apply timing priority sort ONLY for "newest"
  // For all other sorts (price, year), return database order AS-IS without any sorting
  if (sortOption === 'newest') {
    return formattedAuctions.sort((a, b) => {
      const priorityOrder = { active: 0, scheduled: 1, ended: 2, unknown: 3 };
      return priorityOrder[a.auctionTimingStatus] - priorityOrder[b.auctionTimingStatus];
    });
  }
  
  // Return unsorted (maintains database sort order perfectly)
  return formattedAuctions;
};
