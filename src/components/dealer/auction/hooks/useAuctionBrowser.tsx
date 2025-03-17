
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Auction, AuctionFilters } from "../types";
import { useToast } from "@/hooks/use-toast";

const PAGE_SIZE = 10; // Number of items per page

export const useAuctionBrowser = (
  dealerId: string,
  filters: AuctionFilters,
  sortOption: string,
  searchQuery: string,
  currentPage: number
) => {
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery({
    queryKey: ["dealerAuctions", filters, sortOption, searchQuery, currentPage],
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

        // Count total before pagination
        const { count } = await supabase
          .from("cars")
          .select("id", { count: "exact", head: true })
          .eq("is_auction", true)
          .eq("auction_status", "active")
          .eq("is_draft", false);
          
        const totalCount = count || 0;

        // Apply pagination
        const from = (currentPage - 1) * PAGE_SIZE;
        query = query.range(from, from + PAGE_SIZE - 1);
        
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

        // Apply client-side sorting
        const sortedAuctions = [...formattedAuctions].sort((a, b) => {
          switch (sortOption) {
            case "ending-soon":
              return new Date(a.auction_end_time).getTime() - new Date(b.auction_end_time).getTime();
            case "newest":
              return new Date(b.auction_end_time).getTime() - new Date(a.auction_end_time).getTime();
            case "price-low-high":
              return (a.current_bid || a.price) - (b.current_bid || b.price);
            case "price-high-low":
              return (b.current_bid || b.price) - (a.current_bid || a.price);
            case "highest-bid":
              return (b.highest_bid?.amount || 0) - (a.highest_bid?.amount || 0);
            case "year-new-old":
              return (b.year || 0) - (a.year || 0);
            case "year-old-new":
              return (a.year || 0) - (b.year || 0);
            default:
              return 0;
          }
        });

        return {
          auctions: sortedAuctions,
          totalCount,
          totalPages: Math.ceil(totalCount / PAGE_SIZE)
        };
      } catch (err: any) {
        console.error("Error fetching auctions:", err);
        toast({
          title: "Error fetching auctions",
          description: err.message,
          variant: "destructive"
        });
        return { auctions: [], totalCount: 0, totalPages: 0 };
      }
    },
  });

  return {
    auctions: data?.auctions || [],
    totalCount: data?.totalCount || 0,
    totalPages: data?.totalPages || 0,
    isLoading,
    error
  };
};
