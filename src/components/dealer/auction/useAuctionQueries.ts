
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AuctionFilters } from "./types";

export const useAuctionQueries = (filters: AuctionFilters) => {
  return useQuery({
    queryKey: ["auctionListings", filters],
    queryFn: async () => {
      console.log("Fetching auction listings with filters:", filters);
      
      let query = supabase
        .from("cars")
        .select("*")
        .eq("status", "available");

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

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching auction listings:", error);
        throw error;
      }

      console.log(`Found ${data?.length || 0} auction listings`);
      return data || [];
    },
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
  });
};
