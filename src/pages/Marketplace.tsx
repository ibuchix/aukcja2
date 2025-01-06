import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import VehicleCard from "@/components/VehicleCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Database } from "@/integrations/supabase/types";
import { CarListing } from "@/types/cars";
import { useState } from "react";
import CarDetailsDialog from "@/components/CarDetailsDialog";
import { motion } from "framer-motion";
import { ArrowRight, Star, Car, Shield, Clock } from "lucide-react";

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

      const transformedData: CarListing[] = (data || []).map((car: CarRow) => ({
        id: car.id,
        title: car.title,
        price: car.price,
        make: car.make,
        model: car.model,
        year: car.year,
        mileage: car.mileage,
        images: car.images,
        description: car.description,
        features: car.features as CarListing["features"],
        transmission: car.transmission,
        service_history_files: car.service_history_files,
        required_photos: car.required_photos as Record<string, string | null>,
      }));

      return transformedData;
    },
  });

  if (isLoading) {
    return (
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
    );
  }

  const getPrimaryImage = (car: CarListing): string => {
    if (car.required_photos?.front) {
      return car.required_photos.front;
    }
    if (car.images && car.images.length > 0) {
      return car.images[0];
    }
    return "/placeholder.svg";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-iris to-primary/5">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-6 max-w-3xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-dark">
              Find Your Perfect <span className="text-primary">Vehicle</span>
            </h1>
            <p className="text-subtitle-text text-lg md:text-xl">
              Browse through our curated selection of premium vehicles from verified sellers
            </p>
          </motion.div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            {[
              { icon: Car, title: "Premium Selection", description: "Curated high-quality vehicles" },
              { icon: Shield, title: "Verified Sellers", description: "100% trusted dealers" },
              { icon: Clock, title: "Quick Process", description: "Efficient buying experience" },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white/80 backdrop-blur-sm p-6 rounded-lg shadow-sm"
              >
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold">{feature.title}</h3>
                  <p className="text-subtitle-text">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Listings Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="flex justify-between items-center mb-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold">Available Vehicles</h2>
            <p className="text-subtitle-text">Find your next perfect match</p>
          </div>
          <button className="flex items-center gap-2 text-iris hover:text-primary transition-colors">
            <span>View all</span>
            <ArrowRight size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings?.map((car) => (
            <motion.div
              key={car.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
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
            </motion.div>
          ))}
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="bg-accent py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">What Our Dealers Say</h2>
            <p className="text-subtitle-text">Trusted by hundreds of dealers nationwide</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white p-6 rounded-lg shadow-sm"
              >
                <div className="flex items-center gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className="w-4 h-4 text-primary fill-current"
                    />
                  ))}
                </div>
                <p className="text-subtitle-text mb-4">
                  "The platform has transformed how we source our inventory. The process is seamless and the quality of vehicles is outstanding."
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full" />
                  <div>
                    <h4 className="font-semibold">John Smith</h4>
                    <p className="text-subtitle-text text-sm">Premium Motors</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <CarDetailsDialog car={selectedCar} onClose={() => setSelectedCar(null)} />
    </div>
  );
};

export default Marketplace;