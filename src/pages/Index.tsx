
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import CarDetailsDialog from "@/components/CarDetailsDialog";
import { CarListing } from "@/types/cars";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
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
          price: car.reserve_price || car.current_bid || 0, // Add required price property
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <Hero />
      
      {/* Services Section */}
      <Services />
      
      {/* Featured Vehicles Section */}
      <section id="vehicles" className="py-20 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Vehicles</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Discover our selection of premium vehicles. Sign up as a verified dealer to access live auctions and place bids.
            </p>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading featured vehicles...</p>
            </div>
          ) : cars.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No featured vehicles available at the moment.</p>
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
                    <Badge className="absolute top-3 left-3 bg-blue-600 hover:bg-blue-700">
                      Featured
                    </Badge>
                  </div>
                  
                  <CardHeader>
                    <CardTitle className="text-xl font-bold">
                      {car.title}
                    </CardTitle>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-blue-600">
                        {formatCurrency(car.price)}
                      </span>
                      <span className="text-sm text-gray-500">
                        Starting Price
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
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />

      {/* Car Details Dialog */}
      <CarDetailsDialog 
        car={selectedCar} 
        onClose={() => setSelectedCar(null)} 
      />
    </div>
  );
};

export default Index;
