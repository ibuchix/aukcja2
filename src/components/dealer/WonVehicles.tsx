
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Eye, CreditCard, Car, CheckCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { calculatePlatformFee } from "@/utils/platformFeeCalculator";

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
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year: number;
  vehicle_mileage: number | null;
  vehicle_images: string[];
  cars: {
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
         'vehicle_make' in item &&
         'vehicle_model' in item &&
         'vehicle_year' in item;
};

export const WonVehicles = () => {
  const [wonVehicles, setWonVehicles] = useState<WonVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);
  const [refreshingPayment, setRefreshingPayment] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchWonVehicles();
    
    // Check for payment success on page load
    const urlParams = new URLSearchParams(window.location.search);
    const paymentSuccess = urlParams.get('payment_success');
    const sessionId = urlParams.get('session_id');
    const vehicleId = urlParams.get('vehicle_id');
    
    if (paymentSuccess === 'true' && sessionId && vehicleId) {
      handlePaymentSuccess(sessionId, vehicleId);
      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const fetchWonVehicles = async () => {
    try {
      console.log('Fetching won vehicles for current dealer');
      
      // Simplified query - now get vehicle details directly from dealer_won_vehicles
      const { data, error } = await supabase
        .from('dealer_won_vehicles')
        .select(`
          *,
          cars!inner (
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
          // Create a safe vehicle object with all required properties using new columns
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
            vehicle_make: item.vehicle_make || 'Unknown',
            vehicle_model: item.vehicle_model || 'Unknown',
            vehicle_year: item.vehicle_year || 2000,
            vehicle_mileage: item.vehicle_mileage || null,
            vehicle_images: Array.isArray(item.vehicle_images) ? item.vehicle_images : [],
            cars: {
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

  const handlePaymentSuccess = async (sessionId: string, vehicleId: string) => {
    try {
      setProcessingPayment(vehicleId);
      
      // Verify payment status with Stripe
      const { data, error } = await supabase.functions.invoke('verify-payment-status', {
        body: {
          sessionId,
          vehicleId
        }
      });

      if (error) throw error;

      if (data?.success && data?.seller_details_unlocked) {
        // Refresh the vehicles list to show updated payment status
        await fetchWonVehicles();
        
        toast({
          title: "Payment Successful!",
          description: "Seller details have been unlocked. You can now contact the seller.",
          variant: "default",
        });
      } else {
        toast({
          title: "Payment Verification",
          description: "Payment is being processed. Please refresh the page in a moment.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast({
        title: "Verification Error",
        description: "Could not verify payment status. Please contact support if payment was successful.",
        variant: "destructive",
      });
    } finally {
      setProcessingPayment(null);
    }
  };

  const handlePayForAccess = async (vehicleId: string, platformFee: number) => {
    try {
      setProcessingPayment(vehicleId);
      
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
        
        toast({
          title: "Redirecting to Payment",
          description: "You will be redirected to Stripe to complete your payment.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      toast({
        title: "Payment Error",
        description: "Failed to initiate payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      // Don't clear processing state here - keep it until payment completes
      setTimeout(() => setProcessingPayment(null), 2000);
    }
  };

  const handleRefreshPaymentStatus = async (vehicleId: string) => {
    try {
      setRefreshingPayment(vehicleId);
      
      const { data, error } = await supabase.functions.invoke('verify-payment-status', {
        body: {
          vehicleId
        }
      });

      if (error) throw error;

      if (data?.success && data?.seller_details_unlocked) {
        // Refresh the vehicles list to show updated payment status
        await fetchWonVehicles();
        
        toast({
          title: "Payment Verified!",
          description: "Payment status has been updated and seller details are now unlocked.",
          variant: "default",
        });
      } else {
        toast({
          title: "Payment Still Pending",
          description: "Payment verification could not confirm a successful payment. Please try again later or contact support.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error refreshing payment status:', error);
      toast({
        title: "Verification Error",
        description: "Could not verify payment status. Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setRefreshingPayment(null);
    }
  };

  const handleViewDetails = (vehicle: WonVehicle) => {
    // TODO: Open detailed view modal
    toast({
      title: "Vehicle Details",
      description: `Viewing details for ${vehicle.vehicle_make} ${vehicle.vehicle_model}`
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
        <Badge variant="outline" className="bg-accent text-body-text border-accent">
          {wonVehicles.length} vehicle{wonVehicles.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      <div className="grid gap-6">
        {wonVehicles.map((vehicle) => {
          const correctPlatformFee = calculatePlatformFee(vehicle.winning_bid_amount);
          
          return (
            <Card key={vehicle.id} className="bg-background border-accent shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start gap-4">
                  <CardTitle className="text-xl text-body-text font-oswald">
                    {vehicle.vehicle_year} {vehicle.vehicle_make} {vehicle.vehicle_model}
                  </CardTitle>
                  <Badge 
                    variant={vehicle.payment_status === 'paid' ? 'success' : 'warning'}
                    className="shrink-0 font-medium"
                  >
                    {vehicle.payment_status === 'paid' ? 'Access Granted' : 'Payment Required'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                  {/* Vehicle Image */}
                  <div className="aspect-video lg:aspect-[4/3]">
                    <img 
                      src={Array.isArray(vehicle.vehicle_images) && vehicle.vehicle_images.length > 0 
                        ? vehicle.vehicle_images[0] 
                        : '/placeholder.svg'
                      }
                      alt={`${vehicle.vehicle_make} ${vehicle.vehicle_model}`}
                      className="w-full h-full object-cover rounded-lg border border-accent"
                    />
                  </div>

                  {/* Vehicle Details & Platform Fee */}
                  <div className="flex flex-col justify-between space-y-6">
                    <div>
                      <h3 className="font-semibold text-body-text mb-3">Vehicle Details</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-accent/50 p-3 rounded-lg">
                          <p className="text-xs text-subtitle-text uppercase tracking-wide mb-1">Mileage</p>
                          <p className="font-semibold text-body-text">{vehicle.vehicle_mileage?.toLocaleString() || 'N/A'} km</p>
                        </div>
                        <div className="bg-accent/50 p-3 rounded-lg">
                          <p className="text-xs text-subtitle-text uppercase tracking-wide mb-1">Won Date</p>
                          <p className="font-semibold text-body-text">{new Date(vehicle.auction_end_time).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-body-text mb-3">Pricing Details</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-success/10 rounded-lg border border-success/20">
                          <span className="text-sm text-subtitle-text">Final Price</span>
                          <span className="font-bold text-success text-lg">{formatCurrency(vehicle.winning_bid_amount)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-accent/50 rounded-lg">
                          <span className="text-sm text-subtitle-text">Your Original Bid</span>
                          <span className="font-semibold text-body-text">{formatCurrency(vehicle.original_bid_amount)}</span>
                        </div>
                        <div className="p-3 bg-iris-light rounded-lg border border-iris/20">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-subtitle-text">Platform Fee</span>
                            <span className="font-semibold text-body-text">{formatCurrency(correctPlatformFee)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Seller Details Section */}
                  <div className="flex flex-col">
                    <h3 className="font-semibold text-body-text mb-3">Seller Information</h3>
                    <div className="flex-1 flex flex-col">
                      {vehicle.payment_status === 'paid' && vehicle.seller_details_unlocked ? (
                        <div className="bg-accent/50 p-4 rounded-lg space-y-3 h-full">
                          <div>
                            <p className="text-xs text-subtitle-text uppercase tracking-wide mb-1">Seller Name</p>
                            <p className="font-semibold text-body-text">{vehicle.cars.seller_name || 'Not provided'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-subtitle-text uppercase tracking-wide mb-1">Contact</p>
                            <p className="font-semibold text-body-text">{vehicle.cars.mobile_number || 'Not provided'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-subtitle-text uppercase tracking-wide mb-1">Address</p>
                            <p className="font-semibold text-body-text text-sm leading-relaxed">{vehicle.cars.address || 'Not provided'}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gradient-to-br from-accent/30 to-accent/50 p-6 rounded-lg border border-accent text-center h-full flex flex-col justify-center">
                          <div className="flex items-center justify-center text-subtitle-text mb-3">
                            <Lock className="w-6 h-6 mr-2 text-primary" />
                            <span className="font-medium">Seller Details Locked</span>
                          </div>
                          <p className="text-sm text-subtitle-text mb-4 leading-relaxed">
                            Pay the platform fee to unlock seller contact information and complete your purchase
                          </p>
                          <div className="space-y-3">
                            <Button 
                              onClick={() => handlePayForAccess(vehicle.id, correctPlatformFee)}
                              disabled={processingPayment === vehicle.id}
                              className="w-full bg-primary hover:bg-primary/90 text-white font-medium"
                              size="lg"
                            >
                              {processingPayment === vehicle.id ? (
                                <>
                                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                  Processing...
                                </>
                              ) : (
                                <>
                                  <CreditCard className="w-5 h-5 mr-2" />
                                  Pay {formatCurrency(correctPlatformFee)}
                                </>
                              )}
                            </Button>
                            
                            <Button 
                              variant="outline"
                              onClick={() => handleRefreshPaymentStatus(vehicle.id)}
                              disabled={refreshingPayment === vehicle.id}
                              className="w-full border-primary/20 text-primary hover:bg-primary/5"
                              size="sm"
                            >
                              {refreshingPayment === vehicle.id ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Checking...
                                </>
                              ) : (
                                "Refresh Payment Status"
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 pt-4 border-t border-accent">
                  <Button 
                    variant="outline" 
                    onClick={() => handleViewDetails(vehicle)}
                    className="w-full border-primary/20 text-primary hover:bg-primary/5"
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
