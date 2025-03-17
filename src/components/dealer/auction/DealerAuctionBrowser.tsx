
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Auction } from "./types";
import { AuctionTable } from "./AuctionTable";
import { DealerAuctionFilters, AuctionFilters } from "./DealerAuctionFilters";
import { AuctionPagination } from "./AuctionPagination";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface DealerAuctionBrowserProps {
  dealerId: string;
}

const PAGE_SIZE = 10; // Number of items per page

export const DealerAuctionBrowser = ({ dealerId }: DealerAuctionBrowserProps) => {
  const [filters, setFilters] = useState<AuctionFilters>({});
  const [sortOption, setSortOption] = useState<string>("ending-soon");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const { toast } = useToast();

  // Reset to page 1 when filters or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchQuery, sortOption]);

  const { data: auctions, isLoading, error } = useQuery({
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
        const { count } = await query.count();
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
            case "price-high-high":
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

  const handleFiltersChange = (newFilters: AuctionFilters) => {
    setFilters(newFilters);
  };

  const handleSortChange = (sort: string) => {
    setSortOption(sort);
  };

  const handleSearchChange = (search: string) => {
    setSearchQuery(search);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Available Auctions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-destructive">Error loading auctions: {(error as Error).message}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Available Auctions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <DealerAuctionFilters
          onFiltersChange={handleFiltersChange}
          onSortChange={handleSortChange}
          onSearchChange={handleSearchChange}
          sortOption={sortOption}
          searchQuery={searchQuery}
        />
        
        <AuctionTable 
          auctions={auctions?.auctions} 
          isLoading={isLoading} 
          dealerId={dealerId} 
        />
        
        {auctions?.totalPages > 1 && (
          <AuctionPagination
            currentPage={currentPage}
            totalPages={auctions.totalPages}
            onPageChange={handlePageChange}
          />
        )}
        
        {auctions?.auctions.length === 0 && !isLoading && (
          <div className="text-center py-8 text-muted-foreground">
            {Object.keys(filters).length > 0 || searchQuery
              ? "No auctions match your filters. Try adjusting your criteria."
              : "No active auctions available at this time."}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
