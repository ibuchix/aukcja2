
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
import { CarListing } from "@/types/cars";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const [selectedCar, setSelectedCar] = useState<CarListing | null>(null);
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  const { data: featuredVehicles, isLoading, error } = useQuery({
    queryKey: ["featuredVehicles"],
    queryFn: async () => {
      try {
        console.log("Fetching featured vehicles for public display...");
        
        // Public query - no auction schedule data to avoid permission issues
        const { data, error } = await supabase
          .from('cars')
          .select(`
            id,
            make,
            model,
            year,
            mileage,
            reserve_price,
            current_bid,
            images,
            required_photos,
            title,
            transmission,
            features,
            is_auction,
            auction_end_time,
            minimum_bid_increment,
            auction_status,
            is_damaged,
            address,
            seller_notes,
            service_history_type,
            has_service_history,
            seller_id,
            seller_name,
            mobile_number,
            additional_photos,
            vin,
            seat_material,
            number_of_keys,
            is_registered_in_poland,
            has_private_plate,
            finance_amount,
            form_metadata,
            valuation_data,
            last_saved,
            registration_number,
            is_manually_controlled,
            created_at,
            updated_at,
            status
          `)
          .eq("status", "available")
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
        
        // Process cars without auction schedule data for public display
        const processedCars = data
          .filter(item => item && typeof item === 'object')
          .map(car => ({
            id: car.id,
            make: car.make || 'Unknown',
            model: car.model || 'Unknown',
            year: car.year || 0,
            mileage: car.mileage || 0,
            price: car.reserve_price || 0,
            reservePrice: car.reserve_price || 0,
            currentBid: car.current_bid || 0,
            images: car.images || [],
            requiredPhotos: car.required_photos || {},
            additionalPhotos: car.additional_photos || [],
            transmission: car.transmission || 'Unknown',
            features: car.features || {},
            isAuction: car.is_auction || false,
            auctionEndTime: car.auction_end_time || '',
            minimumBidIncrement: car.minimum_bid_increment || 100,
            auctionStatus: car.auction_status || 'inactive',
            isDamaged: car.is_damaged || false,
            address: car.address || '',
            sellerNotes: car.seller_notes || '',
            serviceHistoryType: car.service_history_type || '',
            hasServiceHistory: car.has_service_history || false,
            sellerId: car.seller_id || '',
            sellerName: car.seller_name || '',
            mobileNumber: car.mobile_number || '',
            vin: car.vin || '',
            seatMaterial: car.seat_material || '',
            numberOfKeys: car.number_of_keys || 1,
            isRegisteredInPoland: car.is_registered_in_poland || false,
            hasPrivatePlate: car.has_private_plate || false,
            financeAmount: car.finance_amount || 0,
            formMetadata: car.form_metadata || {},
            valuationData: car.valuation_data || {},
            lastSaved: car.last_saved || '',
            registrationNumber: car.registration_number || '',
            isManuallyControlled: car.is_manually_controlled || false,
            title: car.title || `${car.year || ''} ${car.make || ''} ${car.model || ''}`.trim(),
            // Public users don't see auction schedule data
            scheduleStatus: undefined,
            scheduleStartTime: undefined,
            scheduleEndTime: undefined,
            auctionTimingStatus: 'unknown' as const
          } as CarListing));
        
        return processedCars;
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
                    image={vehicle.requiredPhotos?.front || vehicle.images?.[0] || "/placeholder.svg"}
                    name={`${vehicle.year || 'N/A'} ${vehicle.make || 'Unknown'} ${vehicle.model || 'Model'}`}
                    price={vehicle.reservePrice}
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
