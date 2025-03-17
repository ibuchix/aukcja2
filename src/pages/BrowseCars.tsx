
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Home, SlidersHorizontal, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Database } from "@/integrations/supabase/types";
import { CarListing } from "@/types/cars";
import CarDetailsDialog from "@/components/CarDetailsDialog";
import MarketplaceHero from "@/components/marketplace/MarketplaceHero";
import VehicleListings from "@/components/marketplace/VehicleListings";
import TestimonialsSection from "@/components/marketplace/TestimonialsSection";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import AuctionFilters, { AuctionFilters as FilterTypes } from "@/components/marketplace/AuctionFilters";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

type CarRow = Database["public"]["Tables"]["cars"]["Row"];

const BrowseCars = () => {
  const [selectedCar, setSelectedCar] = useState<CarListing | null>(null);
  const [filters, setFilters] = useState<FilterTypes>({});
  const [sortOption, setSortOption] = useState<string>("newest");
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const { toast } = useToast();

  const { data: listings, isLoading } = useQuery({
    queryKey: ["auctionListings", filters, sortOption, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("cars")
        .select("*")
        .eq("is_auction", true)
        .eq("is_draft", false)
        .eq("auction_status", "active");

      // Apply search query
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

      const { data, error } = await query;

      if (error) throw error;

      const transformedData: CarListing[] = (data || []).map((car: CarRow) => ({
        id: car.id,
        title: car.title,
        price: car.price,
        make: car.make,
        model: car.model,
        year: car.year,
        mileage: car.mileage || 0,
        images: car.images,
        description: null, // Set default value for optional property
        features: car.features as CarListing["features"],
        transmission: car.transmission,
        service_history_files: null, // Set default value for optional property
        required_photos: car.required_photos as Record<string, string | null>,
        is_auction: car.is_auction,
        current_bid: car.current_bid || 0,
        auction_end_time: car.auction_end_time,
        auction_status: car.auction_status,
        reserve_price: car.reserve_price
      }));

      // Apply sorting
      const sortedData = [...transformedData].sort((a, b) => {
        switch (sortOption) {
          case "price-low-high":
            return a.price - b.price;
          case "price-high-low":
            return b.price - a.price;
          case "year-new-old":
            return (b.year || 0) - (a.year || 0);
          case "year-old-new":
            return (a.year || 0) - (b.year || 0);
          case "mileage-low-high":
            return a.mileage - b.mileage;
          case "mileage-high-low":
            return b.mileage - a.mileage;
          case "newest":
          default:
            // Sort by created_at if available, otherwise keep original order
            return 0;
        }
      });

      return sortedData;
    },
  });

  const handleFilterChange = (newFilters: FilterTypes) => {
    setFilters(newFilters);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Link to="/" className="fixed top-6 left-6 p-2 text-gray-700 hover:text-primary transition-colors">
          <Home size={24} />
        </Link>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
              <div className="flex gap-2">
                <Skeleton className="h-10 w-1/2" />
                <Skeleton className="h-10 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Link to="/" className="fixed top-6 left-6 p-2 text-gray-700 hover:text-primary transition-colors z-50">
        <Home size={24} />
      </Link>
      <MarketplaceHero />
      <div className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold mb-6">Available Cars for Auction</h2>
        
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Search by make, model or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal size={16} />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </Button>
          
          <div className="w-full md:w-[200px]">
            <Select
              value={sortOption}
              onValueChange={(value) => setSortOption(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="price-low-high">Price: Low to High</SelectItem>
                <SelectItem value="price-high-low">Price: High to Low</SelectItem>
                <SelectItem value="year-new-old">Year: New to Old</SelectItem>
                <SelectItem value="year-old-new">Year: Old to New</SelectItem>
                <SelectItem value="mileage-low-high">Mileage: Low to High</SelectItem>
                <SelectItem value="mileage-high-low">Mileage: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {showFilters && (
          <div className="mb-8">
            <AuctionFilters onFiltersChange={handleFilterChange} />
          </div>
        )}

        {listings && listings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <VehicleListings 
              listings={listings} 
              onSelectCar={setSelectedCar} 
            />
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-12">
            {Object.keys(filters).length > 0 || searchQuery
              ? "No auctions match your filters. Try adjusting your criteria."
              : "No active auctions at this time."}
          </p>
        )}
      </div>
      <TestimonialsSection />
      <CarDetailsDialog car={selectedCar} onClose={() => setSelectedCar(null)} />
    </div>
  );
};

export default BrowseCars;
