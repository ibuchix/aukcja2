
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { processCarData } from "@/utils/carDataHelpers";
import { DealerAuctionFilters } from "../auction/DealerAuctionFilters";
import { CarListing } from "@/types/cars";
import { AuctionFilters } from "../auction/types";
import { AuctionPagination } from "../auction/AuctionPagination";

interface CarSearchProps {
  dealerId: string;
}

export const CarSearch = ({ dealerId }: CarSearchProps) => {
  const [filters, setFilters] = useState<AuctionFilters>({});
  const [sortOption, setSortOption] = useState<string>("newest");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [listings, setListings] = useState<CarListing[]>([]);
  const pageSize = 10;

  // Query for car listings
  const { isLoading, error, data, refetch } = useQuery({
    queryKey: ["carListings", filters, sortOption, searchQuery, currentPage],
    queryFn: async () => {
      let query = supabase
        .from("cars")
        .select("*")
        .eq("status", "available")
        .eq("is_draft", false);
      
      // Apply filters
      if (filters.make && typeof filters.make === 'string') {
        query = query.ilike('make', `%${filters.make}%`);
      }
      
      if (filters.model && typeof filters.model === 'string') {
        query = query.ilike('model', `%${filters.model}%`);
      }
      
      if (filters.yearMin && typeof filters.yearMin === 'number') {
        query = query.gte('year', filters.yearMin);
      }
      
      if (filters.yearMax && typeof filters.yearMax === 'number') {
        query = query.lte('year', filters.yearMax);
      }
      
      if (filters.priceMin && typeof filters.priceMin === 'number') {
        query = query.gte('price', filters.priceMin);
      }
      
      if (filters.priceMax && typeof filters.priceMax === 'number') {
        query = query.lte('price', filters.priceMax);
      }
      
      // Apply search query
      if (searchQuery) {
        query = query.or(`make.ilike.%${searchQuery}%,model.ilike.%${searchQuery}%,title.ilike.%${searchQuery}%`);
      }
      
      // Apply sorting
      switch (sortOption) {
        case "newest":
          query = query.order('created_at', { ascending: false });
          break;
        case "oldest":
          query = query.order('created_at', { ascending: true });
          break;
        case "price-high":
          query = query.order('price', { ascending: false });
          break;
        case "price-low":
          query = query.order('price', { ascending: true });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }
      
      // Apply pagination
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);
      
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      return {
        cars: processCarData(data || []),
        total: count || 0
      };
    },
  });

  useEffect(() => {
    if (data?.cars) {
      setListings(data.cars);
    }
  }, [data]);

  // Handle filter changes
  const handleFiltersChange = (newFilters: AuctionFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page on filter change
  };

  // Handle sort changes
  const handleSortChange = (sort: string) => {
    setSortOption(sort);
    setCurrentPage(1); // Reset to first page on sort change
  };

  // Handle search changes
  const handleSearchChange = (search: string) => {
    setSearchQuery(search);
    setCurrentPage(1); // Reset to first page on search change
  };

  // Handle pagination
  const canGoNext = data?.total ? currentPage * pageSize < data.total : false;

  const handleNextPage = () => {
    if (canGoNext) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Car Search</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <DealerAuctionFilters
          onFiltersChange={handleFiltersChange}
          onSortChange={handleSortChange}
          onSearchChange={handleSearchChange}
          sortOption={sortOption}
          searchQuery={searchQuery}
        />

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-4 text-center text-destructive">
            Error loading car listings. Please try again.
          </div>
        ) : (
          <>
            {listings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map((car) => (
                  <div key={car.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                    {car.images && car.images[0] ? (
                      <div className="aspect-video w-full overflow-hidden bg-gray-100 dark:bg-gray-900">
                        <img 
                          src={car.images[0]} 
                          alt={car.title || `${car.year} ${car.make} ${car.model}`} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="aspect-video w-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <span className="text-gray-500 dark:text-gray-400">No image</span>
                      </div>
                    )}
                    <div className="p-4 space-y-2">
                      <h3 className="text-lg font-semibold line-clamp-1">
                        {car.title || `${car.year} ${car.make} ${car.model}`}
                      </h3>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {car.year} · {car.make}
                        </span>
                        <span className="font-medium">
                          ${car.price?.toLocaleString()}
                        </span>
                      </div>
                      {car.is_auction ? (
                        <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20">
                          Upcoming Auction
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-800 ring-1 ring-inset ring-green-600/20">
                          Available
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium">No cars found</h3>
                <p className="text-muted-foreground mt-2">
                  Try adjusting your filters or search criteria
                </p>
              </div>
            )}

            <AuctionPagination
              hasMore={canGoNext}
              canGoBack={currentPage > 1}
              onNext={handleNextPage}
              onPrevious={handlePreviousPage}
              isLoading={isLoading}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
};
