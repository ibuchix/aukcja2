
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
import { processCarData } from "@/utils/carDataHelpers";

const Index = () => {
  const [selectedCar, setSelectedCar] = useState<CarListing | null>(null);
  const { toast } = useToast();

  const { data: featuredVehicles, isLoading, error } = useQuery({
    queryKey: ["featuredVehicles"],
    queryFn: async () => {
      try {
        const statusColumn = "status";
        
        console.log("Fetching featured vehicles...");
        const { data, error } = await supabase
          .from('cars')
          .select("*")
          .eq(statusColumn, "available")
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
        return processCarData(data);
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
                    price={vehicle.reserve_price}
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
