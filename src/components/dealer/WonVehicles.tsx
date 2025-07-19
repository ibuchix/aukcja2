
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useCurrentDealerProfile } from "@/hooks/useCurrentDealerProfile";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Car, Calendar, CreditCard, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

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

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'awaiting_seller_decision':
        return <Badge variant="secondary">Awaiting Seller Decision</Badge>;
      case 'payment_required':
        return <Badge variant="destructive">Payment Required</Badge>;
      case 'paid':
        return <Badge variant="default">Paid</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-600">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
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
            <Trophy className="h-8 w-8 text-yellow-500" />
            Won Vehicles
          </h1>
          <p className="text-muted-foreground">
            Auctions you've won and their payment status
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
                  <Skeleton className="h-16 w-16 rounded" />
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
        <div className="grid gap-4">
          {wonVehicles.map((vehicle) => (
            <Card key={vehicle.id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <img
                      src={getVehicleImage(vehicle.vehicle_images)}
                      alt={`${vehicle.vehicle_year} ${vehicle.vehicle_make} ${vehicle.vehicle_model}`}
                      className="h-16 w-16 rounded object-cover"
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                          <Car className="h-5 w-5" />
                          {vehicle.vehicle_year} {vehicle.vehicle_make} {vehicle.vehicle_model}
                        </h3>
                        {vehicle.vehicle_mileage && (
                          <p className="text-sm text-muted-foreground">
                            {vehicle.vehicle_mileage.toLocaleString()} miles
                          </p>
                        )}
                      </div>
                      {getPaymentStatusBadge(vehicle.payment_status)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Winning Bid</p>
                        <p className="font-semibold text-green-600">
                          {formatCurrency(vehicle.winning_bid_amount)}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Platform Fee</p>
                        <p className="font-semibold">
                          {formatCurrency(vehicle.platform_fee)}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Auction Ended
                        </p>
                        <p className="text-sm">
                          {new Date(vehicle.auction_end_time).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    {vehicle.payment_status === 'payment_required' && (
                      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center gap-2 text-yellow-800">
                          <CreditCard className="h-4 w-4" />
                          <span className="font-medium">Payment Required</span>
                        </div>
                        <p className="text-sm text-yellow-700 mt-1">
                          The seller has accepted your bid. Please complete payment to secure your purchase.
                        </p>
                        <div className="mt-2">
                          <p className="text-sm font-medium">
                            Total Amount: {formatCurrency(vehicle.winning_bid_amount + vehicle.platform_fee)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-6 w-6" />
              No Won Vehicles Yet
            </CardTitle>
            <CardDescription>
              You haven't won any auctions yet. Keep bidding on vehicles you're interested in!
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
};
