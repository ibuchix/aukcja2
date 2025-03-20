
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Auction, AuctionFilters } from "../types";
import { useToast } from "@/hooks/use-toast";
import { createCursor, decodeCursor, getCursorOperator, PaginationResult } from "@/utils/cursorPagination";

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
        // Start building the query
        let query = supabase
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
          .eq("is_draft", false);

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

        // Get dealer's bids for these auctions
        const auctionIds = auctionData.map((a) => a.id);
        const { data: dealerBids } = await supabase
          .from("bids")
          .select("car_id, amount, status")
          .eq("dealer_id", dealerId)
          .in("car_id", auctionIds);

        // Format the data
        const formattedAuctions = auctionData.map((auction) => ({
          ...auction,
          highest_bid: auction.highest_bid?.[0],
          my_bid: dealerBids?.find((bid) => bid.car_id === auction.id),
        })) as Auction[];

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
        } as PaginationResult<Auction>;
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
        };
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
