import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CarListing } from "@/types/cars";
import VehicleCard from "@/components/VehicleCard";

interface VehicleListingsProps {
  listings: CarListing[] | undefined;
}

const VehicleListings = ({ listings }: VehicleListingsProps) => {
  const navigate = useNavigate();

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
            onClick={() => navigate(`/dealer/auctions/${car.id}`)}
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
  );
};

export default VehicleListings;