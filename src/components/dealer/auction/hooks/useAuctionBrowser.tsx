import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Auction, AuctionFilters } from "../types";
import { useToast } from "@/hooks/use-toast";
import { createCursor, decodeCursor, getCursorOperator, AuctionPaginationResult } from "@/utils/cursorPagination";
import { isValidRecord, isSelectQueryError, isValidBid, safelyFilterData } from "@/utils/supabaseHelpers";

const PAGE_SIZE = 10; // Number of items per page

interface CarData {
  id: string;
  title?: string;
  auction_end_time?: string;
  make?: string;
  model?: string;
  year?: number;
  mileage?: number;
  price?: number;
  current_bid?: number;
  reserve_price?: number;
  is_auction?: boolean;
  auction_status?: string;
  // Auction schedule fields
  schedule_status?: string;
  schedule_start_time?: string;
  schedule_end_time?: string;
  is_manually_controlled?: boolean;
}

interface BidData {
  car_id: string;
  amount: number;
  status?: string;
}

export const useAuctionBrowser = (
  dealerId: string,
  filters: AuctionFilters,
  sortOption: string,
  searchQuery: string,
  cursor: string | null = null,
  direction: 'next' | 'prev' = 'next'
) => {
  const { toast } = useToast();

  // Determine sort field and direction based on sortOption
  const getSortConfig = () => {
    switch (sortOption) {
      case "ending-soon":
        return { field: 'auction_end_time', direction: 'asc' as const };
      case "newest":
        return { field: 'auction_end_time', direction: 'desc' as const };
      case "price-low-high":
        return { field: 'price', direction: 'asc' as const };
      case "price-high-low":
        return { field: 'price', direction: 'desc' as const };
      case "highest-bid":
        return { field: 'current_bid', direction: 'desc' as const };
      case "year-new-old":
        return { field: 'year', direction: 'desc' as const };
      case "year-old-new":
        return { field: 'year', direction: 'asc' as const };
      default:
        return { field: 'auction_end_time', direction: 'asc' as const };
    }
  };

  const { field: sortField, direction: sortDirection } = getSortConfig();

  const { data, isLoading, error } = useQuery({
    queryKey: ["dealerAuctions", filters, sortOption, searchQuery, cursor, direction],
    queryFn: async () => {
      try {
        // Updated query to include auction schedule information and look for both 'active' and 'running' statuses
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
            auction_schedules!inner(
              id,
              status,
              start_time,
              end_time,
              is_manually_controlled
            )
          `)
          .eq('auction_status', 'active')
          .eq('is_auction', true)
          // Show cars that have auction schedules with either 'active' or 'running' status
          .in('auction_schedules.status', ['active', 'running']);

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
        
        // Get the data
        const { data: auctionData, error } = await query;
        if (error) throw error;

        // Process the data to extract schedule information
        const processedData = (auctionData || []).map(item => {
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
        const typedAuctionData = processedData
          .filter(item => isValidRecord<CarData>(item) && !isSelectQueryError(item)) as CarData[];
        
        // Get dealer's bids for these auctions
        const auctionIds = typedAuctionData
          .map(a => a?.id)
          .filter(Boolean);
          
        let dealerBids: BidData[] = [];
        
        if (auctionIds.length > 0) {
          const { data: bidsData } = await supabase
            .from("bids")
            .select("car_id, amount, status")
            .eq("dealer_id", dealerId)
            .in("car_id", auctionIds)
            .order('amount', { ascending: false });
            
          if (bidsData) {
            // Filter valid bids
            dealerBids = safelyFilterData(bidsData, isValidBid);
            
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

        // Format the data with proper type handling
        const formattedAuctions = typedAuctionData
          .map((auction) => {
            if (!auction || !auction.id) return null;
            
            const dealerBid = dealerBids.find(bid => bid && bid.car_id === auction.id);
            const currentBid = auction.current_bid || 0;
            const reservePrice = auction.reserve_price || 0;
            
            // Check if this auction's current_bid is higher than the dealer's bid
            const isOutbid = dealerBid && currentBid > (dealerBid.amount || 0);
            
            // Determine auction timing status
            const now = new Date();
            const startTime = auction.schedule_start_time ? new Date(auction.schedule_start_time) : null;
            const endTime = auction.schedule_end_time ? new Date(auction.schedule_end_time) : null;
            
            let auctionTimingStatus = 'unknown';
            if (startTime && endTime) {
              if (now < startTime) {
                auctionTimingStatus = 'scheduled';
              } else if (now >= startTime && now <= endTime) {
                auctionTimingStatus = 'running';
              } else {
                auctionTimingStatus = 'ended';
              }
            }
            
            return {
              id: auction.id,
              title: auction.title || '',
              make: auction.make || '',
              model: auction.model || '',
              year: auction.year || 0,
              mileage: auction.mileage || 0,
              price: auction.price || 0,
              auction_end_time: auction.auction_end_time,
              auction_status: 'active',
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
              auctionTimingStatus: auctionTimingStatus // Fixed: using camelCase instead of snake_case
            } as Auction;
          })
          .filter((item): item is Auction => item !== null);

        // Determine if there are more pages
        const hasMore = formattedAuctions.length > PAGE_SIZE;
        
        // Remove the extra item if it exists
        const auctions = hasMore ? formattedAuctions.slice(0, PAGE_SIZE) : formattedAuctions;
        
        // Create next and previous cursors
        const nextCursor = auctions.length > 0 
          ? createCursor(auctions[auctions.length - 1], sortField as keyof Auction) 
          : null;
        
        const prevCursor = auctions.length > 0 
          ? createCursor(auctions[0], sortField as keyof Auction) 
          : null;

        return {
          auctions,
          hasMore,
          nextCursor,
          prevCursor
        } as AuctionPaginationResult<Auction>;
      } catch (err: any) {
        console.error("Error fetching auctions:", err);
        toast({
          title: "Error fetching auctions",
          description: err.message,
          variant: "destructive"
        });
        return { 
          auctions: [], 
          hasMore: false,
          nextCursor: null, 
          prevCursor: null 
        } as AuctionPaginationResult<Auction>;
      }
    },
  });

  return {
    auctions: data?.auctions || [],
    hasMore: data?.hasMore || false,
    nextCursor: data?.nextCursor,
    prevCursor: data?.prevCursor,
    isLoading,
    error
  };
};
