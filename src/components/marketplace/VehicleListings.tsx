
import { motion } from "framer-motion";
import { Coins, Clock, Info, ShieldAlert } from "lucide-react";
import { CarListing } from "@/types/cars";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useState } from "react";
import CarDetailsDialog from "@/components/CarDetailsDialog";
import { getPrimaryImage } from "@/utils/imageUtils";

interface VehicleListingsProps {
  listings: CarListing[] | undefined;
  onSelectCar: (car: CarListing) => void;
}

const VehicleListings = ({ listings, onSelectCar }: VehicleListingsProps) => {
  const [selectedCar, setSelectedCar] = useState<CarListing | null>(null);

  const formatAuctionEndTime = (endTime: string | null | undefined) => {
    if (!endTime) return "N/A";
    return format(new Date(endTime), "MMM dd, yyyy HH:mm");
  };

  const getTimeRemaining = (endTime: string | null | undefined) => {
    if (!endTime) return null;
    
    const end = new Date(endTime);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return "Ended";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h left`;
    } else {
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m left`;
    }
  };

  const handleSelectCar = (car: CarListing) => {
    setSelectedCar(car);
    onSelectCar(car);
  };

  return (
    <>
      {listings?.map((car) => (
        <motion.div
          key={car.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow border border-gray-200"
        >
          <div className="relative">
            <img
              src={getPrimaryImage(car)}
              alt={`${car.make} ${car.model}`}
              className="w-full h-48 object-cover"
            />
            <div className="absolute top-2 right-2">
              <Badge variant="secondary" className="bg-white text-primary font-bold">
                {car.current_bid ? formatCurrency(car.current_bid) : formatCurrency(car.reserve_price)}
              </Badge>
            </div>
            
            <div className="absolute bottom-2 right-2">
              <Badge variant="outline" className="bg-white/80 border-primary text-primary text-xs">
                <ShieldAlert size={12} className="mr-1" />
                Reserve: {formatCurrency(car.reserve_price)}
              </Badge>
            </div>
            
            {car.auction_end_time && (
              <div className="absolute bottom-2 left-2">
                <Badge variant="outline" className="bg-white/80 border-amber-500 text-amber-700 text-xs">
                  {getTimeRemaining(car.auction_end_time)}
                </Badge>
              </div>
            )}
          </div>
          
          <div className="p-4">
            <h3 className="text-lg font-semibold truncate">
              {car.year} {car.make} {car.model}
            </h3>
            
            <div className="mt-2 space-y-2 text-sm text-gray-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Coins size={16} className="text-gray-400" />
                  <span>Current Bid:</span>
                </div>
                <span className="font-medium">
                  {car.current_bid ? formatCurrency(car.current_bid) : "No bids yet"}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Clock size={16} className="text-gray-400" />
                  <span>Ends:</span>
                </div>
                <span className="font-medium">
                  {formatAuctionEndTime(car.auction_end_time)}
                </span>
              </div>
              
              {car.mileage !== undefined && (
                <div className="flex items-center justify-between">
                  <span>Mileage:</span>
                  <span className="font-medium">{car.mileage.toLocaleString()} km</span>
                </div>
              )}
            </div>
            
            <div className="mt-4 flex justify-between items-center">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-1/2"
                onClick={() => handleSelectCar(car)}
              >
                <Info size={16} className="mr-1" />
                Details
              </Button>
              
              <Button 
                variant="default" 
                size="sm" 
                className="w-1/2 ml-2"
                onClick={() => handleSelectCar(car)}
              >
                View Auction
              </Button>
            </div>
          </div>
        </motion.div>
      ))}
      
      <CarDetailsDialog 
        car={selectedCar} 
        onClose={() => setSelectedCar(null)}
      />
    </>
  );
};

export default VehicleListings;
