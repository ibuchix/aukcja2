
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CarListing, CarFeatures } from "@/types/cars";
import { Skeleton } from "@/components/ui/skeleton";
import VehicleListings from "@/components/marketplace/VehicleListings";
import CarDetailsDialog from "@/components/CarDetailsDialog";
import { MaxBidInterface } from "@/components/auction/MaxBidInterface";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuctionFilters, { AuctionFilters as FilterType } from "@/components/marketplace/AuctionFilters";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const calculateDistance = (lat1?: number, lon1?: number, lat2?: number, lon2?: number) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const Auctions = () => {
  const [selectedCar, setSelectedCar] = useState<CarListing | null>(null);
  const [filters, setFilters] = useState<FilterType>({});
  const [bidDialogOpen, setBidDialogOpen] = useState<boolean>(false);

  const { data: activeAuctions, isLoading } = useQuery({
    queryKey: ["auctions", filters],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cars")
        .select("*")
        .eq("is_auction", true)
        .eq("auction_status", "active")
        .order("auction_end_time", { ascending: true });

      if (error) throw error;

      return (data || [])
        .map(car => {
          const carFeatures = typeof car.features === 'string' 
            ? JSON.parse(car.features) 
            : car.features as Record<string, boolean>;

          const features: CarFeatures = {
            satNav: Boolean(carFeatures?.satNav),
            heatedSeats: Boolean(carFeatures?.heatedSeats),
            panoramicRoof: Boolean(carFeatures?.panoramicRoof),
            reverseCamera: Boolean(carFeatures?.reverseCamera),
            upgradedSound: Boolean(carFeatures?.upgradedSound)
          };

          return {
            ...car,
            features,
            distance: null,
          } as CarListing;
        })
        .filter(car => {
          if (filters.priceMin && car.price < filters.priceMin) return false;
          if (filters.priceMax && car.price > filters.priceMax) return false;
          if (filters.make && !car.make?.toLowerCase().includes(filters.make.toLowerCase())) return false;
          if (filters.model && !car.model?.toLowerCase().includes(filters.model.toLowerCase())) return false;
          if (filters.yearMin && car.year && car.year < filters.yearMin) return false;
          if (filters.yearMax && car.year && car.year > filters.yearMax) return false;
          if (filters.mileageMin && car.mileage < filters.mileageMin) return false;
          if (filters.mileageMax && car.mileage > filters.mileageMax) return false;
          return true;
        }) as CarListing[];
    },
  });

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

  const handleViewBidding = (car: CarListing) => {
    setSelectedCar(car);
    setBidDialogOpen(true);
  };

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
        
        <div className="mb-8">
          <AuctionFilters onFiltersChange={setFilters} />
        </div>

        <VehicleListings 
          listings={activeAuctions || []}
          onSelectCar={setSelectedCar}
          actionButton={(car) => 
            dealerData?.id && (
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewBidding(car);
                }}
                className="w-full mt-2"
              >
                Bid Now
              </Button>
            )
          }
        />
      </div>

      <Dialog open={bidDialogOpen} onOpenChange={setBidDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          {selectedCar && dealerData?.id && (
            <MaxBidInterface
              carId={selectedCar.id}
              dealerId={dealerData.id}
              currentHighestBid={selectedCar.current_bid || selectedCar.price}
              minimumIncrement={selectedCar.minimum_bid_increment || 100}
              auctionEndTime={selectedCar.auction_end_time || new Date().toISOString()}
            />
          )}
        </DialogContent>
      </Dialog>

      <CarDetailsDialog 
        car={selectedCar} 
        onClose={() => setSelectedCar(null)} 
      />
      <Footer />
    </div>
  );
};

export default Auctions;
