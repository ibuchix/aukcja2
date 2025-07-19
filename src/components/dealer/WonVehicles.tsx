
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCurrentDealerProfile } from "@/hooks/useCurrentDealerProfile";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { calculatePlatformFee } from "@/utils/platformFeeCalculator";
import CarDetailsDialog from "@/components/CarDetailsDialog";

interface WonVehicle {
  id: string;
  car_id: string;
  winning_bid_amount: number;
  platform_fee: number;
  auction_end_time: string;
  payment_status: string;
  seller_details_unlocked: boolean;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year: number;
  vehicle_mileage: number | null;
  vehicle_images: any;
  created_at: string;
  updated_at: string;
}

export const WonVehicles = () => {
  const { dealerProfile, isLoading: dealerLoading } = useCurrentDealerProfile();
  const { toast } = useToast();
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);

  const { data: wonVehicles, isLoading, error, refetch } = useQuery({
    queryKey: ["wonVehicles", dealerProfile?.id],
    queryFn: async () => {
      if (!dealerProfile?.id) {
        console.log("No dealer profile ID available");
        return [];
      }

      console.log("Fetching won vehicles for dealer:", dealerProfile.id);
      
      const { data, error } = await supabase
        .from("dealer_won_vehicles")
        .select("*")
        .eq("dealer_id", dealerProfile.id)
        .order("auction_end_time", { ascending: false });

      if (error) {
        console.error("Error fetching won vehicles:", error);
        throw error;
      }

      console.log("Won vehicles data:", data);
      return (data as unknown as WonVehicle[]) || [];
    },
    enabled: !!dealerProfile?.id,
  });

  // Query for car details when showing dialog
  const { data: selectedCar } = useQuery({
    queryKey: ["carDetails", selectedCarId],
    queryFn: async () => {
      if (!selectedCarId) return null;
      
      const { data, error } = await supabase
        .from("cars")
        .select("*")
        .eq("id", selectedCarId)
        .single();

      if (error) {
        console.error("Error fetching car details:", error);
        return null;
      }

      return data;
    },
    enabled: !!selectedCarId,
  });

  const handleRefresh = async () => {
    try {
      await refetch();
      toast({
        title: "Refreshed",
        description: "Won vehicles list has been updated",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh won vehicles list",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getVehicleImage = (images: any) => {
    if (typeof images === 'string') {
      try {
        const parsed = JSON.parse(images);
        return Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : '/placeholder.svg';
      } catch {
        return '/placeholder.svg';
      }
    }
    if (Array.isArray(images) && images.length > 0) {
      return images[0];
    }
    return '/placeholder.svg';
  };

  const handleViewDetails = (carId: string) => {
    setSelectedCarId(carId);
  };

  const handleCloseDialog = () => {
    setSelectedCarId(null);
  };

  if (dealerLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!dealerProfile) {
    return (
      <Alert>
        <AlertDescription>
          Please complete your dealer profile to view won vehicles.
        </AlertDescription>
      </Alert>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Error loading won vehicles: {error instanceof Error ? error.message : 'Unknown error'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-heading-lg font-oswald">Won Vehicles</h1>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">{wonVehicles?.length || 0} vehicles</span>
          <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            Real-time updates active
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <div className="flex items-center gap-2 text-sm text-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            Auto-refresh ON
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-24 w-32 rounded" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : wonVehicles && wonVehicles.length > 0 ? (
        <div className="space-y-6">
          {wonVehicles.map((vehicle) => {
            const calculatedPlatformFee = calculatePlatformFee(vehicle.winning_bid_amount);
            
            return (
              <div key={vehicle.id} className="space-y-4">
                {/* Vehicle Title and Payment Badge */}
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900">
                    {vehicle.vehicle_year} {vehicle.vehicle_make} {vehicle.vehicle_model}
                  </h2>
                  <div className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-lg text-sm font-semibold">
                    Payment Required
                  </div>
                </div>

                {/* Main Card */}
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
                      {/* Vehicle Image Section */}
                      <div className="relative bg-gray-100 flex items-center justify-center h-64">
                        <img
                          src={getVehicleImage(vehicle.vehicle_images)}
                          alt={`${vehicle.vehicle_year} ${vehicle.vehicle_make} ${vehicle.vehicle_model}`}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Vehicle Details Section */}
                      <div className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Vehicle Details</h3>
                        
                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div>
                            <p className="text-sm text-gray-500 uppercase tracking-wide">MILEAGE</p>
                            <p className="font-semibold">{vehicle.vehicle_mileage?.toLocaleString() || 'N/A'} km</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 uppercase tracking-wide">WON DATE</p>
                            <p className="font-semibold">{new Date(vehicle.auction_end_time).toLocaleDateString('en-GB')}</p>
                          </div>
                        </div>

                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Pricing Details</h4>
                        
                        <div className="space-y-3">
                          <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                            <span className="text-gray-700">Final Price</span>
                            <span className="font-bold text-green-600 text-lg">
                              {formatCurrency(vehicle.winning_bid_amount)}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="text-gray-700">Your Original Bid</span>
                            <span className="font-semibold">
                              {formatCurrency(vehicle.winning_bid_amount)}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                            <span className="text-gray-700">Platform Fee</span>
                            <span className="font-bold text-blue-600">
                              {formatCurrency(calculatedPlatformFee)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Seller Information Section */}
                      <div className="p-6 bg-green-50">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Seller Information</h3>
                        
                        <div className="text-center mb-6">
                          <div className="flex items-center justify-center gap-2 text-green-600 mb-2">
                            <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                            <span className="font-semibold">Bid Accepted!</span>
                          </div>
                          <p className="text-sm text-gray-600 mb-4">
                            Seller has accepted your bid - Payment required. You can now pay the platform fee to complete the purchase.
                          </p>
                        </div>

                        <div className="space-y-3">
                          <Button 
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold"
                            size="lg"
                          >
                            <span className="mr-2">💳</span>
                            Pay {formatCurrency(calculatedPlatformFee)}
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            className="w-full text-red-600 border-red-200 hover:bg-red-50"
                            size="sm"
                          >
                            Refresh Payment Status
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* View Full Details Button */}
                <div className="flex justify-center">
                  <Button 
                    variant="outline" 
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    size="lg"
                    onClick={() => handleViewDetails(vehicle.car_id)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Full Details
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="h-16 w-16 text-gray-400 mx-auto mb-4 flex items-center justify-center">
              <Eye className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No won vehicles</h3>
            <p className="text-gray-600">
              You haven't won any auctions yet. Continue bidding on vehicles that interest you!
            </p>
          </CardContent>
        </Card>
      )}

      {/* Car Details Dialog */}
      {selectedCar && (
        <CarDetailsDialog
          car={selectedCar}
          onClose={handleCloseDialog}
        />
      )}
    </div>
  );
};
