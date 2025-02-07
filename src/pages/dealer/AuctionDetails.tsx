import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Home } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CarListing, CarFeatures } from "@/types/cars";
import { MaxBidInterface } from "@/components/auction/MaxBidInterface";
import BasicSpecifications from "@/components/car-details/BasicSpecifications";
import ConditionAndFeatures from "@/components/car-details/ConditionAndFeatures";
import ServiceHistory from "@/components/car-details/ServiceHistory";
import VehiclePhotos from "@/components/car-details/VehiclePhotos";
import Location from "@/components/car-details/Location";
import AdditionalInfo from "@/components/car-details/AdditionalInfo";

const AuctionDetails = () => {
  const { id } = useParams();

  const { data: car, isLoading: isLoadingCar } = useQuery({
    queryKey: ["carDetails", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cars")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      // Transform the features to match CarFeatures type
      const transformedData: CarListing = {
        ...data,
        features: {
          satNav: data.features?.satNav ?? false,
          heatedSeats: data.features?.heatedSeats ?? false,
          panoramicRoof: data.features?.panoramicRoof ?? false,
          reverseCamera: data.features?.reverseCamera ?? false,
          upgradedSound: data.features?.upgradedSound ?? false,
        } as CarFeatures,
        required_photos: data.required_photos as Record<string, string | null> ?? {},
      };

      return transformedData;
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

  if (isLoadingCar) {
    return <div>Loading...</div>;
  }

  if (!car) {
    return <div>Car not found</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Link to="/dealer/dashboard" className="fixed top-6 left-6 p-2 text-gray-700 hover:text-primary transition-colors">
        <Home size={24} />
      </Link>
      
      <div className="container mx-auto px-4 py-16">
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold font-oswald">
              {car.year} {car.make} {car.model}
            </h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <VehiclePhotos car={car} />
              <BasicSpecifications car={car} />
              <ConditionAndFeatures car={car} />
              <ServiceHistory car={car} />
              <Location car={car} />
              <AdditionalInfo car={car} />
            </div>

            <div className="lg:col-span-1">
              {car.is_auction && dealerData?.id && (
                <div className="sticky top-8">
                  <MaxBidInterface
                    carId={car.id}
                    dealerId={dealerData.id}
                    currentHighestBid={car.price}
                    minimumIncrement={100}
                    auctionEndTime={car.auction_end_time}
                    auctionFormat={car.auction_format}
                    extensionsUsed={car.extensions_used}
                    maxExtensionsAllowed={car.max_extensions_allowed}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionDetails;