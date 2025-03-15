
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import VehicleCard from "@/components/VehicleCard";
import Services from "@/components/Services";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import CarDetailsDialog from "@/components/CarDetailsDialog";
import { CarListing, CarFeatures } from "@/types/cars";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [selectedCar, setSelectedCar] = useState<CarListing | null>(null);
  const { toast } = useToast();

  const { data: featuredVehicles, isLoading, error } = useQuery({
    queryKey: ["featuredVehicles"],
    queryFn: async () => {
      try {
        const statusColumn = "status";
        const isDraftColumn = "is_draft";
        
        console.log("Fetching featured vehicles...");
        const { data, error } = await supabase
          .from('cars')
          .select("*")
          .eq(statusColumn, "available")
          .eq(isDraftColumn, false)
          .limit(4)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching featured vehicles:", error);
          throw error;
        }

        if (!data || data.length === 0) {
          console.log("No featured vehicles found");
          return [];
        }

        console.log(`Found ${data.length} featured vehicles`);
        return data.map(car => {
          // Create default features object
          let parsedFeatures: CarFeatures = {
            satNav: false,
            heatedSeats: false,
            panoramicRoof: false,
            reverseCamera: false,
            upgradedSound: false
          };
          
          // Parse the features object safely
          try {
            if (typeof car.features === 'string') {
              const featuresObj = JSON.parse(car.features);
              parsedFeatures = {
                satNav: Boolean(featuresObj?.satNav),
                heatedSeats: Boolean(featuresObj?.heatedSeats),
                panoramicRoof: Boolean(featuresObj?.panoramicRoof),
                reverseCamera: Boolean(featuresObj?.reverseCamera),
                upgradedSound: Boolean(featuresObj?.upgradedSound)
              };
            } else if (car.features && typeof car.features === 'object') {
              const featuresObj = car.features as Record<string, any>;
              parsedFeatures = {
                satNav: Boolean(featuresObj?.satNav),
                heatedSeats: Boolean(featuresObj?.heatedSeats),
                panoramicRoof: Boolean(featuresObj?.panoramicRoof),
                reverseCamera: Boolean(featuresObj?.reverseCamera),
                upgradedSound: Boolean(featuresObj?.upgradedSound)
              };
            }
          } catch (e) {
            console.error("Error parsing features:", e);
            // Default features already set at initialization
          }
          
          // Extract required_photos safely
          let requiredPhotos: Record<string, string | null> | null = null;
          if (car.required_photos && typeof car.required_photos === 'object') {
            requiredPhotos = car.required_photos as Record<string, string | null>;
          }
          
          // Create the car listing with all properties explicitly declared
          const carListing: CarListing = {
            id: car.id,
            title: car.title || null,
            price: car.price || 0,
            make: car.make || null,
            model: car.model || null,
            year: car.year || null,
            mileage: car.mileage || 0,
            images: car.images || null,
            features: parsedFeatures,
            transmission: car.transmission || null,
            required_photos: requiredPhotos,
            
            // Add any optional properties that might be missing in the database
            description: (car as any).description || null,
            service_history_files: (car as any).service_history_files || null,
            is_auction: Boolean((car as any).is_auction),
            auction_end_time: (car as any).auction_end_time || null,
            auction_start_time: (car as any).auction_start_time || null,
            reserve_price: (car as any).reserve_price || null,
            minimum_bid_increment: (car as any).minimum_bid_increment || null,
            auction_status: (car as any).auction_status || null,
            is_damaged: Boolean((car as any).is_damaged),
            address: (car as any).address || null,
            condition_rating: (car as any).condition_rating !== undefined ? (car as any).condition_rating : undefined,
            distance: (car as any).distance || null,
            created_at: car.created_at,
            updated_at: (car as any).updated_at || car.created_at,
            status: car.status || null,
            is_draft: Boolean(car.is_draft)
          };
          
          return carListing;
        });
      } catch (err) {
        console.error("Failed to fetch featured vehicles:", err);
        if (err && typeof err === 'object' && 'status' in err && 
            (err.status !== 401 && err.status !== 403)) {
          toast({
            title: "Error",
            description: "Failed to load featured vehicles",
            variant: "destructive",
          });
        }
        return [];
      }
    },
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      
      <section id="vehicles" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Featured Vehicles</h2>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="h-48 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-10">
              <p className="text-gray-500">Unable to load featured vehicles at this time.</p>
            </div>
          ) : featuredVehicles && featuredVehicles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredVehicles.map((vehicle) => (
                <div 
                  key={vehicle.id}
                  onClick={() => setSelectedCar(vehicle)}
                  className="cursor-pointer"
                >
                  <VehicleCard
                    image={vehicle.required_photos?.front || vehicle.images?.[0] || "/placeholder.svg"}
                    name={`${vehicle.year || 'N/A'} ${vehicle.make || 'Unknown'} ${vehicle.model || 'Model'}`}
                    price={vehicle.price}
                    mileage={vehicle.mileage}
                    transmission={vehicle.transmission}
                    year={vehicle.year}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-500">No vehicles available at the moment. Please check back later.</p>
            </div>
          )}
        </div>
      </section>

      <Services />
      <Footer />
      
      <CarDetailsDialog 
        car={selectedCar} 
        onClose={() => setSelectedCar(null)} 
      />
    </div>
  );
};

export default Index;
