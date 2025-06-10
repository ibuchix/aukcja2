
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { createCursor, AuctionPaginationResult } from "@/utils/cursorPagination";
import { AuctionFilters, Auction } from "../types";
import { getSortConfig } from "./utils/sortConfigUtils";
import { buildAuctionQuery, fetchDealerBids, processAuctionData, formatAuctionData } from "./services/auctionDataService";

const PAGE_SIZE = 10;

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
  const { field: sortField, direction: sortDirection } = getSortConfig();

  const { data, isLoading, error } = useQuery({
    queryKey: ["dealerAuctions", filters, sortOption, searchQuery, cursor, direction],
    queryFn: async () => {
      try {
        // Build and execute the auction query
        const query = buildAuctionQuery(filters, searchQuery, sortField, sortDirection, cursor, direction);
        const { data: auctionData, error } = await query;
        
        if (error) throw error;

        // Process the auction data
        const typedAuctionData = processAuctionData(auctionData || []);
        
        // Get dealer's bids for these auctions
        const auctionIds = typedAuctionData
          .map(a => a?.id)
          .filter(Boolean);
          
        const dealerBids = await fetchDealerBids(dealerId, auctionIds);

        // Format the data with proper type handling
        const formattedAuctions = formatAuctionData(typedAuctionData, dealerBids);

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

        console.log('Final auctions data (using calculated status):', auctions.map(a => ({
          id: a.id,
          make: a.make,
          model: a.model,
          auctionTimingStatus: a.auctionTimingStatus,
          scheduleStatus: a.schedule_status,
          scheduleStartTime: a.schedule_start_time,
          scheduleEndTime: a.schedule_end_time
        })));

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
