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
import { filterString, filterBoolean } from "@/utils/supabaseHelpers";

const Index = () => {
  const [selectedCar, setSelectedCar] = useState<CarListing | null>(null);

  const { data: featuredVehicles, isLoading } = useQuery({
    queryKey: ["featuredVehicles"],
    queryFn: async () => {
      const statusColumn = filterString('status');
      const isDraftColumn = filterBoolean('is_draft');
      
      const { data, error } = await supabase
        .from('cars')
        .select("*")
        .eq(statusColumn, "available")
        .eq(isDraftColumn, false)
        .limit(4)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data.map(car => {
        let features = car.features;
        try {
          if (typeof features === 'string') {
            features = JSON.parse(features);
          }
        } catch (e) {
          console.error("Error parsing features:", e);
          features = {
            satNav: false,
            heatedSeats: false,
            panoramicRoof: false,
            reverseCamera: false,
            upgradedSound: false
          };
        }
        
        return {
          ...car,
          features: features || {
            satNav: false,
            heatedSeats: false,
            panoramicRoof: false,
            reverseCamera: false,
            upgradedSound: false
          },
        };
      }) as CarListing[];
    },
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
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredVehicles?.map((vehicle) => (
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
