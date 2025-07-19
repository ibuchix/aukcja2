
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useCurrentDealerProfile } from "@/hooks/useCurrentDealerProfile";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Car } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { calculatePlatformFee } from "@/utils/platformFeeCalculator";

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
          Please complete your dealer profile setup to view won vehicles.
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
        <div>
          <h1 className="text-heading-lg font-oswald flex items-center gap-2">
            <Car className="h-8 w-8 text-primary" />
            Won Vehicles
          </h1>
          <p className="text-muted-foreground">
            Vehicles you've successfully won at auction
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
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
        <div className="grid gap-6">
          {wonVehicles.map((vehicle) => {
            const calculatedPlatformFee = calculatePlatformFee(vehicle.winning_bid_amount);
            const totalAmount = vehicle.winning_bid_amount + calculatedPlatformFee;
            
            return (
              <Card key={vehicle.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
                    {/* Vehicle Image Section */}
                    <div className="relative">
                      <img
                        src={getVehicleImage(vehicle.vehicle_images)}
                        alt={`${vehicle.vehicle_year} ${vehicle.vehicle_make} ${vehicle.vehicle_model}`}
                        className="w-full h-48 lg:h-full object-cover"
                      />
                      <div className="absolute top-4 left-4">
                        <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                          Bid Accepted!
                        </div>
                      </div>
                    </div>

                    {/* Vehicle & Pricing Details Section */}
                    <div className="p-6">
                      <div className="mb-4">
                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                          {vehicle.vehicle_year} {vehicle.vehicle_make} {vehicle.vehicle_model}
                        </h3>
                        {vehicle.vehicle_mileage && (
                          <p className="text-gray-600">
                            {vehicle.vehicle_mileage.toLocaleString()} miles
                          </p>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Your winning bid:</span>
                          <span className="font-semibold text-green-600">
                            {formatCurrency(vehicle.winning_bid_amount)}
                          </span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-gray-600">Platform fee:</span>
                          <span className="font-semibold">
                            {formatCurrency(calculatedPlatformFee)}
                          </span>
                        </div>
                        
                        <div className="border-t pt-3">
                          <div className="flex justify-between">
                            <span className="font-semibold text-gray-900">Total to pay:</span>
                            <span className="font-bold text-lg text-gray-900">
                              {formatCurrency(totalAmount)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Seller Information & Actions Section */}
                    <div className="p-6 bg-gray-50 flex flex-col justify-between">
                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-900 mb-2">Seller Information</h4>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>Auction ended: {new Date(vehicle.auction_end_time).toLocaleDateString()}</p>
                          <p>Status: Payment Required</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Button 
                          className="w-full bg-red-600 hover:bg-red-700 text-white"
                          size="lg"
                        >
                          Pay {formatCurrency(totalAmount)}
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          className="w-full"
                          size="sm"
                        >
                          View Full Details
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Car className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Won Vehicles Yet</h3>
            <p className="text-gray-600">
              You haven't won any auctions yet. Keep bidding on vehicles you're interested in!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
