
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Auction, AuctionFilters } from "../types";
import { useToast } from "@/hooks/use-toast";
import { createCursor, decodeCursor, getCursorOperator, AuctionPaginationResult } from "@/utils/cursorPagination";

const PAGE_SIZE = 10; // Number of items per page

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
        // Use the materialized view for better performance
        let query = supabase
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
          `);

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

        // Get dealer's bids for these auctions from the mv_dealer_bids materialized view
        const auctionIds = auctionData.map((a) => a.id);
        const { data: dealerBids } = await supabase
          .from("mv_dealer_bids")
          .select("car_id, my_highest_bid, outbid")
          .eq("dealer_id", dealerId)
          .in("car_id", auctionIds);

        // Format the data
        const formattedAuctions = auctionData.map((auction) => {
          const dealerBid = dealerBids?.find(bid => bid.car_id === auction.id);
          return {
            ...auction,
            auction_status: 'active', // This view only contains active auctions
            my_bid: dealerBid ? {
              amount: dealerBid.my_highest_bid,
              status: dealerBid.outbid ? 'outbid' : 'active',
              car_id: auction.id
            } : undefined,
            highest_bid: auction.current_bid ? {
              amount: auction.current_bid,
              dealer_id: ''  // We don't have this info in the materialized view
            } : undefined
          };
        }) as Auction[];

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
