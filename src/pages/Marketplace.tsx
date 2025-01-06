import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import VehicleCard from "@/components/VehicleCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Database } from "@/integrations/supabase/types";
import { CarListing } from "@/types/cars";
import { useState } from "react";
import CarDetailsDialog from "@/components/CarDetailsDialog";

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

      const transformedData: CarListing[] = (data || []).map((car: CarRow) => {
        const carFeatures = car.features as CarListing["features"] || {
          satNav: false,
          heatedSeats: false,
          panoramicRoof: false,
          reverseCamera: false,
          upgradedSound: false,
        };

        return {
          id: car.id,
          title: car.title,
          price: car.price,
          make: car.make,
          model: car.model,
          year: car.year,
          mileage: car.mileage,
          images: car.images,
          description: car.description,
          features: {
            satNav: carFeatures.satNav || false,
            heatedSeats: carFeatures.heatedSeats || false,
            panoramicRoof: carFeatures.panoramicRoof || false,
            reverseCamera: carFeatures.reverseCamera || false,
            upgradedSound: carFeatures.upgradedSound || false,
          },
          transmission: car.transmission,
          service_history_files: car.service_history_files,
          required_photos: car.required_photos as Record<string, string | null>,
        };
      });

      return transformedData;
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Marketplace</h1>
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

  // Helper function to get the primary image for a car
  const getPrimaryImage = (car: CarListing): string => {
    // First try to get the front view from required photos
    if (car.required_photos?.front) {
      return car.required_photos.front;
    }
    // Then try the first image from the images array
    if (car.images && car.images.length > 0) {
      return car.images[0];
    }
    // Fallback to placeholder
    return "/placeholder.svg";
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Marketplace</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {listings?.map((car) => (
          <div
            key={car.id}
            onClick={() => setSelectedCar(car)}
            className="cursor-pointer"
          >
            <VehicleCard
              image={getPrimaryImage(car)}
              name={`${car.year || "N/A"} ${car.make || "Unknown"} ${
                car.model || "Model"
              }`}
              price={car.price}
              mileage={car.mileage}
              transmission={car.transmission}
              year={car.year}
            />
          </div>
        ))}
      </div>

      <CarDetailsDialog car={selectedCar} onClose={() => setSelectedCar(null)} />
    </div>
  );
};

export default Marketplace;