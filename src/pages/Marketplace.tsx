
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Home } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Database } from "@/integrations/supabase/types";
import { CarListing } from "@/types/cars";
import { useState } from "react";
import CarDetailsDialog from "@/components/CarDetailsDialog";
import MarketplaceHero from "@/components/marketplace/MarketplaceHero";
import VehicleListings from "@/components/marketplace/VehicleListings";
import TestimonialsSection from "@/components/marketplace/TestimonialsSection";
import { MaxBidInterface } from "@/components/auction/MaxBidInterface";

type CarRow = Database["public"]["Tables"]["cars"]["Row"];

const Marketplace = () => {
  const [selectedCar, setSelectedCar] = useState<CarListing | null>(null);

  const { data: listings, isLoading } = useQuery({
    queryKey: ["carListings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cars")
        .select("*")
        .eq("status", "available")
        .eq("is_draft", false);

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
        description: null, // Add missing required field
        features: car.features as CarListing["features"],
        transmission: car.transmission,
        service_history_files: null, // Add missing required field
        required_photos: car.required_photos as Record<string, string | null>,
      }));

      return transformedData;
    },
  });

  // Fetch dealer ID for the current user
  const { data: dealerData } = useQuery({
    queryKey: ["dealerProfile"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const { data, error } = await supabase
        .from("dealers")
        .select("id")
        .eq("user_id", session.user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Link to="/" className="fixed top-6 left-6 p-2 text-gray-700 hover:text-primary transition-colors">
          <Home size={24} />
        </Link>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
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
      <VehicleListings listings={listings} onSelectCar={setSelectedCar} />
      <TestimonialsSection />
      {selectedCar?.is_auction && dealerData?.id && (
        <MaxBidInterface
          carId={selectedCar.id}
          dealerId={dealerData.id}
          currentHighestBid={selectedCar.price}
          minimumIncrement={100}
          auctionEndTime={selectedCar.auction_end_time}
        />
      )}
      <CarDetailsDialog car={selectedCar} onClose={() => setSelectedCar(null)} />
    </div>
  );
};

export default Marketplace;
