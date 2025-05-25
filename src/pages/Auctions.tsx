
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Home } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { CarListing } from "@/types/cars";
import CarDetailsDialog from "@/components/CarDetailsDialog";
import MarketplaceHero from "@/components/marketplace/MarketplaceHero";
import VehicleListings from "@/components/marketplace/VehicleListings";
import TestimonialsSection from "@/components/marketplace/TestimonialsSection";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { processCarData } from "@/utils/carDataHelpers";

const Auctions = () => {
  const [selectedCar, setSelectedCar] = useState<CarListing | null>(null);
  const { toast } = useToast();

  const { data: listings, isLoading } = useQuery({
    queryKey: ["auctionListings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cars")
        .select("*")
        .eq("is_auction", true)
        .eq("auction_status", "active");

      if (error) throw error;
      
      return processCarData(data);
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

      if (error) {
        console.error("Error fetching dealer profile:", error);
        return null;
      }
      
      return data;
    },
  });

  // Action button for auctions
  const auctionActionButton = (car: CarListing) => {
    return (
      <Button
        onClick={() => setSelectedCar(car)}
        variant="default"
        className="w-full mt-2"
      >
        View Auction
      </Button>
    );
  };

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
      <div className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold mb-8 text-center">Active Auctions</h2>
        {listings && listings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <VehicleListings 
                key={listing.id} 
                listings={[listing]} 
                onSelectCar={setSelectedCar} 
              />
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-12">No active auctions at this time.</p>
        )}
      </div>
      <TestimonialsSection />
      <CarDetailsDialog car={selectedCar} onClose={() => setSelectedCar(null)} />
    </div>
  );
};

export default Auctions;
