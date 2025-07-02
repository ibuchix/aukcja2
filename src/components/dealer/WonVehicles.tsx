
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Eye, CreditCard, Car } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { calculatePlatformFee, getPlatformFeeTier } from "@/utils/platformFeeCalculator";

interface WonVehicle {
  id: string;
  car_id: string;
  auction_end_time: string;
  winning_bid_amount: number;
  original_bid_amount: number;
  second_highest_bid: number | null;
  platform_fee: number;
  payment_status: 'pending' | 'paid' | 'failed';
  payment_date: string | null;
  seller_details_unlocked: boolean;
  cars: {
    make: string;
    model: string;
    year: number;
    mileage: number;
    images: string[];
    seller_name?: string;
    mobile_number?: string;
    address?: string;
  };
}

// Type guard to check if a data item is valid and not a query error
const isValidWonVehicleData = (item: any): item is any => {
  return item !== null && 
         typeof item === 'object' && 
         !('message' in item) && // Check it's not an error object
         !('code' in item) && // Additional check for error objects
         'winning_bid_amount' in item && 
         typeof item.winning_bid_amount === 'number' &&
         'cars' in item && 
         item.cars !== null &&
         typeof item.cars === 'object';
};

export const WonVehicles = () => {
  const [wonVehicles, setWonVehicles] = useState<WonVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchWonVehicles();
  }, []);

  const fetchWonVehicles = async () => {
    try {
      console.log('Fetching won vehicles for current dealer');
      
      // Remove the explicit dealer_id filter - let RLS handle access control
      const { data, error } = await supabase
        .from('dealer_won_vehicles')
        .select(`
          *,
          cars!inner (
            make,
            model,
            year,
            mileage,
            images,
            seller_name,
            mobile_number,
            address
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Raw data from Supabase:', data);
      
      // Process data safely with proper type checking
      const processedData: WonVehicle[] = [];
      
      if (Array.isArray(data)) {
        // Filter valid items first, then process them
        const validItems = data.filter(isValidWonVehicleData);
        
        validItems.forEach((item) => {
          // Create a safe vehicle object with all required properties
          const vehicle: WonVehicle = {
            id: item.id || '',
            car_id: item.car_id || '',
            auction_end_time: item.auction_end_time || '',
            winning_bid_amount: item.winning_bid_amount,
            original_bid_amount: item.original_bid_amount || 0,
            second_highest_bid: item.second_highest_bid || null,
            platform_fee: calculatePlatformFee(item.winning_bid_amount),
            payment_status: (item.payment_status as 'pending' | 'paid' | 'failed') || 'pending',
            payment_date: item.payment_date || null,
            seller_details_unlocked: item.seller_details_unlocked || false,
            cars: {
              make: item.cars?.make || 'Unknown',
              model: item.cars?.model || 'Unknown',
              year: item.cars?.year || 0,
              mileage: item.cars?.mileage || 0,
              images: Array.isArray(item.cars?.images) ? item.cars.images : [],
              seller_name: item.cars?.seller_name,
              mobile_number: item.cars?.mobile_number,
              address: item.cars?.address
            }
          };
          
          processedData.push(vehicle);
        });
      }
      
      console.log('Processed won vehicles:', processedData);
      setWonVehicles(processedData);
    } catch (error) {
      console.error('Error fetching won vehicles:', error);
      toast({
        title: "Error",
        description: "Failed to load won vehicles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePayForAccess = async (vehicleId: string, platformFee: number) => {
    try {
      // Call Stripe checkout function - we'll implement this next
      const { data, error } = await supabase.functions.invoke('create-platform-fee-payment', {
        body: {
          vehicleId,
          platformFee
        }
      });

      if (error) throw error;

      if (data?.url) {
        // Open Stripe checkout in a new tab
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      toast({
        title: "Payment Error",
        description: "Failed to initiate payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleViewDetails = (vehicle: WonVehicle) => {
    // TODO: Open detailed view modal
    toast({
      title: "Vehicle Details",
      description: `Viewing details for ${vehicle.cars.make} ${vehicle.cars.model}`
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (wonVehicles.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Won Auctions</h3>
            <p className="text-muted-foreground">
              You haven't won any auctions yet. Keep bidding to win your first vehicle!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Won Vehicles</h2>
        <Badge variant="secondary">
          {wonVehicles.length} vehicle{wonVehicles.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      <div className="grid gap-6">
        {wonVehicles.map((vehicle) => {
          const correctPlatformFee = calculatePlatformFee(vehicle.winning_bid_amount);
          const feeTier = getPlatformFeeTier(vehicle.winning_bid_amount);
          
          return (
            <Card key={vehicle.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">
                    {vehicle.cars.year} {vehicle.cars.make} {vehicle.cars.model}
                  </CardTitle>
                  <Badge variant={vehicle.payment_status === 'paid' ? 'default' : 'secondary'}>
                    {vehicle.payment_status === 'paid' ? 'Access Granted' : 'Payment Required'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {/* Vehicle Image */}
                  <div className="aspect-video lg:aspect-square">
                    <img 
                      src={Array.isArray(vehicle.cars.images) && vehicle.cars.images.length > 0 
                        ? vehicle.cars.images[0] 
                        : '/placeholder.svg'
                      }
                      alt={`${vehicle.cars.make} ${vehicle.cars.model}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>

                  {/* Vehicle Details */}
                  <div className="lg:col-span-2">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Mileage</p>
                        <p className="font-medium">{vehicle.cars.mileage?.toLocaleString()} km</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Final Price</p>
                        <p className="font-medium text-green-600">{formatCurrency(vehicle.winning_bid_amount)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Your Original Bid</p>
                        <p className="font-medium">{formatCurrency(vehicle.original_bid_amount)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Won Date</p>
                        <p className="font-medium">{new Date(vehicle.auction_end_time).toLocaleDateString()}</p>
                      </div>
                    </div>

                    {/* Platform Fee Details */}
                    <div className="p-3 bg-muted rounded-lg mb-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Platform Fee</span>
                          <span className="font-medium">{formatCurrency(correctPlatformFee)}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Fee tier: {feeTier}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Seller Details Section */}
                  <div>
                    <h4 className="font-medium mb-3">Seller Information</h4>
                    {vehicle.payment_status === 'paid' && vehicle.seller_details_unlocked ? (
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm text-muted-foreground">Seller Name</p>
                          <p className="font-medium">{vehicle.cars.seller_name || 'Not provided'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Contact</p>
                          <p className="font-medium">{vehicle.cars.mobile_number || 'Not provided'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Address</p>
                          <p className="font-medium text-sm">{vehicle.cars.address || 'Not provided'}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-muted rounded-lg">
                        <div className="flex items-center justify-center text-muted-foreground mb-2">
                          <Lock className="w-5 h-5 mr-2" />
                          <span className="text-sm">Seller details are locked</span>
                        </div>
                        <p className="text-xs text-center text-muted-foreground mb-3">
                          Pay the platform fee to unlock seller contact information
                        </p>
                        <Button 
                          onClick={() => handlePayForAccess(vehicle.id, correctPlatformFee)}
                          className="w-full"
                          size="sm"
                        >
                          <CreditCard className="w-4 h-4 mr-2" />
                          Pay {formatCurrency(correctPlatformFee)}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-6">
                  <Button 
                    variant="outline" 
                    onClick={() => handleViewDetails(vehicle)}
                    className="flex-1"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Full Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
