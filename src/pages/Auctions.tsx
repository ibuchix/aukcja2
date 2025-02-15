
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CarListing } from "@/types/cars";
import { Skeleton } from "@/components/ui/skeleton";
import VehicleListings from "@/components/marketplace/VehicleListings";
import CarDetailsDialog from "@/components/CarDetailsDialog";
import { MaxBidInterface } from "@/components/auction/MaxBidInterface";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const Auctions = () => {
  const [selectedCar, setSelectedCar] = useState<CarListing | null>(null);

  // Fetch active auctions
  const { data: auctions, isLoading } = useQuery({
    queryKey: ["auctions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cars")
        .select("*")
        .eq("is_auction", true)
        .eq("auction_status", "active")
        .order("auction_end_time", { ascending: true });

      if (error) throw error;

      return data as CarListing[];
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
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
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
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-16">
        <div className="space-y-4 mb-8">
          <h1 className="text-4xl font-bold font-oswald">Live Auctions</h1>
          <p className="text-subtitle-text">
            Browse and bid on vehicles currently up for auction
          </p>
        </div>
        <VehicleListings 
          listings={auctions} 
          onSelectCar={setSelectedCar} 
        />
      </div>
      {selectedCar && dealerData?.id && (
        <MaxBidInterface
          carId={selectedCar.id}
          dealerId={dealerData.id}
          currentHighestBid={selectedCar.price}
          minimumIncrement={selectedCar.minimum_bid_increment || 100}
          auctionEndTime={selectedCar.auction_end_time || new Date().toISOString()}
        />
      )}
      <CarDetailsDialog 
        car={selectedCar} 
        onClose={() => setSelectedCar(null)} 
      />
      <Footer />
    </div>
  );
};

export default Auctions;
