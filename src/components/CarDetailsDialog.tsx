
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CarListing } from "@/types/cars";
import { formatCurrency } from "@/lib/utils";
import { Calendar, Gauge, MapPin, Clock, Car } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CarDetailsDialogProps {
  car: CarListing | null;
  onClose: () => void;
}

const CarDetailsDialog = ({ car, onClose }: CarDetailsDialogProps) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Query for auction schedule data
  const { data: scheduleData } = useQuery({
    queryKey: ["auction-schedule", car?.id],
    queryFn: async () => {
      if (!car?.id) return null;
      
      const { data, error } = await supabase
        .from("auction_schedules")
        .select("*")
        .eq("car_id", car.id)
        .single();

      if (error) {
        console.warn("Could not fetch auction schedule:", error);
        return null;
      }

      return data;
    },
    enabled: !!car?.id,
  });

  if (!car) return null;

  // Safe access to schedule data with proper type checking
  const hasValidSchedule = scheduleData && 
    typeof scheduleData === 'object' && 
    !('error' in scheduleData) &&
    'start_time' in scheduleData &&
    'end_time' in scheduleData &&
    'status' in scheduleData;

  const scheduleInfo = hasValidSchedule ? {
    startTime: scheduleData?.start_time as string,
    endTime: scheduleData?.end_time as string,
    status: scheduleData?.status as string
  } : null;

  const getAuctionStatus = () => {
    if (!scheduleInfo) return "Available";
    
    const now = new Date();
    const startTime = new Date(scheduleInfo.startTime);
    const endTime = new Date(scheduleInfo.endTime);
    
    if (scheduleInfo.status === 'cancelled') return "Cancelled";
    if (now < startTime) return "Scheduled";
    if (now >= startTime && now <= endTime) return "Live Auction";
    if (now > endTime) return "Ended";
    
    return "Available";
  };

  const auctionStatus = getAuctionStatus();

  return (
    <Dialog open={!!car} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{car.title}</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
              {car.images && car.images.length > 0 ? (
                <img
                  src={car.images[selectedImageIndex] || car.images[0]}
                  alt={car.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Car className="w-16 h-16" />
                </div>
              )}
            </div>
            
            {car.images && car.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {car.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                      selectedImageIndex === index ? 'border-blue-500' : 'border-gray-200'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${car.title} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Vehicle Details */}
          <div className="space-y-6">
            {/* Status and Price */}
            <div className="flex items-center justify-between">
              <Badge 
                variant={auctionStatus === "Live Auction" ? "default" : "secondary"}
                className={auctionStatus === "Live Auction" ? "bg-green-600" : ""}
              >
                {auctionStatus}
              </Badge>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-600">
                  {formatCurrency(car.currentBid || car.price)}
                </div>
                <div className="text-sm text-gray-500">
                  {car.currentBid ? "Current Bid" : "Starting Price"}
                </div>
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-400" />
                <span>{car.year}</span>
              </div>
              <div className="flex items-center gap-2">
                <Gauge className="h-5 w-5 text-gray-400" />
                <span>{car.mileage?.toLocaleString()} km</span>
              </div>
              <div className="flex items-center gap-2">
                <Car className="h-5 w-5 text-gray-400" />
                <span className="capitalize">{car.transmission}</span>
              </div>
              {car.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <span className="truncate">{car.address}</span>
                </div>
              )}
            </div>

            {/* Auction Timing */}
            {scheduleInfo && (
              <div className="space-y-2">
                <h3 className="font-semibold">Auction Schedule</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span>Starts: {new Date(scheduleInfo.startTime).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span>Ends: {new Date(scheduleInfo.endTime).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Features */}
            {car.features && typeof car.features === 'object' && Object.keys(car.features).length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold">Features</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(car.features).map(([key, value]) => (
                    <Badge key={key} variant="outline">
                      {key}: {String(value)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Call to Action */}
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-600 mb-4">
                To participate in auctions and place bids, you need to register as a verified dealer.
              </p>
              <div className="flex gap-2">
                <Button className="flex-1">
                  Register as Dealer
                </Button>
                <Button variant="outline">
                  Learn More
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CarDetailsDialog;
