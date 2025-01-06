import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import VehicleCard from "@/components/VehicleCard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Database } from "@/integrations/supabase/types";

type CarFeatures = {
  satNav: boolean;
  heatedSeats: boolean;
  panoramicRoof: boolean;
  reverseCamera: boolean;
  upgradedSound: boolean;
};

interface CarListing {
  id: string;
  title: string;
  price: number;
  make: string | null;
  model: string | null;
  year: number | null;
  mileage: number;
  images: string[] | null;
  description: string | null;
  features: CarFeatures;
  transmission: string | null;
  service_history_files: string[] | null;
  required_photos: Record<string, string | null> | null;
}

type CarRow = Database['public']['Tables']['cars']['Row'];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN'
  }).format(amount);
};

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

      // Transform the data to match our CarListing interface
      const transformedData: CarListing[] = (data || []).map((car: CarRow) => {
        const carFeatures = car.features as CarFeatures || {
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
              image={car.images?.[0] || "/placeholder.svg"}
              name={`${car.year || 'N/A'} ${car.make || 'Unknown'} ${car.model || 'Model'}`}
              price={formatCurrency(car.price)}
              specs={{
                speed: "N/A",
                acceleration: "N/A",
                power: `${car.mileage.toLocaleString()} miles`,
              }}
            />
          </div>
        ))}
      </div>

      <Dialog open={!!selectedCar} onOpenChange={() => setSelectedCar(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {selectedCar?.year} {selectedCar?.make} {selectedCar?.model}
            </DialogTitle>
            <DialogDescription>
              View detailed information about this vehicle
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[80vh]">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {selectedCar?.images?.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`${selectedCar.make} ${selectedCar.model} - Image ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                ))}
                {selectedCar?.required_photos && Object.entries(selectedCar.required_photos).map(([key, value]) => 
                  value && (
                    <img
                      key={key}
                      src={value}
                      alt={`${key.replace(/_/g, ' ').toUpperCase()}`}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  )
                )}
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">Price</h3>
                  <p className="text-2xl text-primary">
                    {formatCurrency(selectedCar?.price || 0)}
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Details</h3>
                  <ul className="list-disc list-inside space-y-2">
                    <li>Mileage: {selectedCar?.mileage.toLocaleString()} miles</li>
                    <li>Transmission: {selectedCar?.transmission || 'N/A'}</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Features</h3>
                  <ul className="list-disc list-inside space-y-2">
                    {selectedCar?.features &&
                      Object.entries(selectedCar.features).map(
                        ([key, value]) =>
                          value && (
                            <li key={key}>
                              {key
                                .replace(/([A-Z])/g, " $1")
                                .replace(/^./, (str) => str.toUpperCase())}
                            </li>
                          )
                      )}
                  </ul>
                </div>
                {selectedCar?.service_history_files && selectedCar.service_history_files.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold">Service History Documents</h3>
                    <ul className="list-disc list-inside space-y-2">
                      {selectedCar.service_history_files.map((file, index) => (
                        <li key={index}>
                          <a 
                            href={file} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            Document {index + 1}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-semibold">Description</h3>
                  <p className="text-gray-600">{selectedCar?.description || 'No description available'}</p>
                </div>
              </div>
              <div className="pt-4">
                <Button className="w-full">Place Bid</Button>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Marketplace;