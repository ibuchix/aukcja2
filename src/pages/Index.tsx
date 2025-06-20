
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import CarDetailsDialog from "@/components/CarDetailsDialog";
import { CarListing } from "@/types/cars";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Clock, MapPin, Gauge, Calendar } from "lucide-react";

const Index = () => {
  const [selectedCar, setSelectedCar] = useState<CarListing | null>(null);

  const { data: cars = [], isLoading } = useQuery({
    queryKey: ["featured-cars"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cars")
        .select("*")
        .eq("is_auction", true)
        .eq("status", "available")
        .limit(6);

      if (error) throw error;
      
      // Filter out any invalid results and convert to CarListing format
      return (data || [])
        .filter((car: any) => car && typeof car === 'object' && !('error' in car) && car.id)
        .map((car: any) => ({
          id: car.id,
          make: car.make || '',
          model: car.model || '',
          year: car.year || 0,
          mileage: car.mileage || 0,
          reservePrice: car.reserve_price || 0,
          currentBid: car.current_bid || car.reserve_price || 0,
          images: car.images || [],
          auctionEndTime: car.auction_end_time || '',
          title: car.title || `${car.year} ${car.make} ${car.model}`,
          address: car.address || '',
          features: car.features || {},
          transmission: car.transmission || 'manual',
          minimumBidIncrement: car.minimum_bid_increment || 100,
        } as CarListing));
    },
  });

  const handleCarClick = (car: CarListing) => {
    setSelectedCar(car);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading auction vehicles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
              Premium Car Auctions
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Discover exceptional vehicles at competitive prices. Join verified dealers in our exclusive auction platform.
            </p>
          </div>
        </div>
      </div>

      {/* Featured Auctions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Live Auctions</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Browse our current selection of premium vehicles available for auction. 
            Sign in as a verified dealer to place bids.
          </p>
        </div>

        {cars.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No live auctions available at the moment.</p>
            <p className="text-gray-400 mt-2">Check back soon for new listings!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {cars.map((car) => (
              <Card 
                key={car.id} 
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleCarClick(car)}
              >
                <div className="aspect-video bg-gray-200 relative">
                  {car.images && car.images.length > 0 ? (
                    <img
                      src={car.images[0]}
                      alt={car.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No Image Available
                    </div>
                  )}
                  <Badge className="absolute top-3 left-3 bg-green-600 hover:bg-green-700">
                    Live Auction
                  </Badge>
                </div>
                
                <CardHeader>
                  <CardTitle className="text-xl font-bold">
                    {car.title}
                  </CardTitle>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-blue-600">
                      {formatCurrency(car.currentBid)}
                    </span>
                    <span className="text-sm text-gray-500">
                      Current Bid
                    </span>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>{car.year}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Gauge className="h-4 w-4 text-gray-400" />
                      <span>{car.mileage?.toLocaleString()} km</span>
                    </div>
                  </div>
                  
                  {car.address && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span className="truncate">{car.address}</span>
                    </div>
                  )}
                  
                  {car.auctionEndTime && (
                    <div className="flex items-center gap-2 text-sm text-orange-600">
                      <Clock className="h-4 w-4" />
                      <span>Ends: {new Date(car.auctionEndTime).toLocaleDateString()}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Car Details Dialog */}
      <CarDetailsDialog 
        car={selectedCar} 
        onClose={() => setSelectedCar(null)} 
      />
    </div>
  );
};

export default Index;
