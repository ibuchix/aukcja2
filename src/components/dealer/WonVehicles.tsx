import React, { useState, useEffect } from "react";
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

// Seller Contact Component
const SellerContactInfo = ({ vehicleId }: { vehicleId: string }) => {
  const { data: carData } = useQuery({
    queryKey: ["car-seller-details", vehicleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cars")
        .select("seller_name, mobile_number, address")
        .eq("id", vehicleId)
        .single();

      if (error) {
        console.error("Error fetching seller details:", error);
        return null;
      }
      return data;
    },
  });

  console.log("SellerContactInfo rendering for vehicle:", vehicleId, "Data:", carData);
  
  return (
    <div className="p-6 bg-green-100 rounded-lg border-2 border-green-300 shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-4 h-4 bg-green-600 rounded-full"></div>
        <span className="font-bold text-green-900 text-lg">🎉 Payment Complete!</span>
      </div>
      
      <div className="mb-6 bg-white p-4 rounded-lg border border-green-200">
        <h4 className="font-bold text-gray-900 mb-3 text-lg">📞 Seller Contact Information</h4>
        {carData ? (
          <div className="space-y-3">
            <div className="bg-gray-50 p-3 rounded">
              <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Name:</span>
              <p className="font-bold text-lg text-gray-900">{(carData as any)?.seller_name || 'Name not available'}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Phone:</span>
              <p className="font-bold text-lg text-blue-600">{(carData as any)?.mobile_number || 'Phone not available'}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Address:</span>
              <p className="font-bold text-lg text-gray-900">{(carData as any)?.address || 'Address not available'}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center p-8">
            <p className="text-lg text-gray-600 font-semibold">Loading seller details...</p>
          </div>
        )}
      </div>
      
      <Button 
        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold text-lg py-3"
        size="lg"
        onClick={() => {
          if ((carData as any)?.mobile_number) {
            window.open(`tel:${(carData as any).mobile_number}`, '_self');
          }
        }}
      >
        <span className="mr-2">📞</span>
        Call Seller Now
      </Button>
    </div>
  );
};

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
  const [paymentLoading, setPaymentLoading] = useState<string | null>(null);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);

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

  // Handle payment completion from Stripe redirect
  useEffect(() => {
    const handlePaymentCompletion = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const paymentSuccess = urlParams.get('payment_success');
      const sessionId = urlParams.get('session_id');
      const vehicleId = urlParams.get('vehicle_id');

      console.log('URL parameters:', { paymentSuccess, sessionId, vehicleId });

      if (paymentSuccess === 'true' && vehicleId && !isVerifyingPayment) {
        setIsVerifyingPayment(true);
        console.log('Processing payment completion for vehicle:', vehicleId);

        try {
          const { data, error } = await supabase.functions.invoke('verify-payment-status', {
            body: {
              sessionId: sessionId,
              vehicleId: vehicleId,
            },
          });

          console.log('Payment verification response:', data, error);

          if (error) {
            throw error;
          }

          if (data?.success && data?.payment_status === 'paid') {
            toast({
              title: "Payment Confirmed!",
              description: "Your payment has been processed successfully. Seller details are now available.",
            });

            // Refetch the won vehicles data to get updated status
            await refetch();
          } else {
            throw new Error('Payment verification failed');
          }
        } catch (error) {
          console.error('Error verifying payment:', error);
          toast({
            title: "Payment Verification Error",
            description: "There was an issue verifying your payment. Please refresh the page or contact support.",
            variant: "destructive",
          });
        } finally {
          setIsVerifyingPayment(false);
          
          // Clean up URL parameters
          const newUrl = window.location.pathname;
          window.history.replaceState({}, '', newUrl);
        }
      }
    };

    // Only run if we have dealer profile loaded
    if (dealerProfile?.id) {
      handlePaymentCompletion();
    }
  }, [dealerProfile?.id, toast, refetch, isVerifyingPayment]);

  // Query for car details when showing dialog
  const { data: selectedCarData } = useQuery({
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

  // Transform database car data to CarListing format
  const selectedCar = selectedCarData ? {
    id: (selectedCarData as any).id || '',
    title: (selectedCarData as any).title || `${(selectedCarData as any).year} ${(selectedCarData as any).make} ${(selectedCarData as any).model}`,
    make: (selectedCarData as any).make || '',
    model: (selectedCarData as any).model || '',
    year: (selectedCarData as any).year || 0,
    mileage: (selectedCarData as any).mileage || 0,
    price: (selectedCarData as any).reserve_price || 0,
    reservePrice: (selectedCarData as any).reserve_price || 0,
    currentBid: (selectedCarData as any).current_bid,
    auctionEndTime: (selectedCarData as any).auction_end_time,
    auctionStatus: (selectedCarData as any).auction_status,
    status: (selectedCarData as any).status,
    images: (selectedCarData as any).images || [],
    fuelType: (selectedCarData as any).fuel_type,
    transmission: (selectedCarData as any).transmission,
    location: (selectedCarData as any).address,
    vin: (selectedCarData as any).vin,
    features: (selectedCarData as any).features || {},
    additional_photos: (selectedCarData as any).additional_photos,
    required_photos: (selectedCarData as any).required_photos
  } : null;

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

  const handlePayment = async (vehicleId: string, platformFee: number) => {
    try {
      setPaymentLoading(vehicleId);
      
      const { data, error } = await supabase.functions.invoke('create-platform-fee-payment', {
        body: {
          vehicleId,
          platformFee,
        },
      });

      if (error) {
        throw error;
      }

      if (data?.url) {
        // Open Stripe checkout in a new tab
        window.open(data.url, '_blank');
        
        toast({
          title: "Payment Processing",
          description: "Opening Stripe checkout in a new tab...",
        });
      } else {
        throw new Error('No payment URL received');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Error",
        description: error.message || "Failed to create payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPaymentLoading(null);
    }
  };

  if (dealerLoading || isVerifyingPayment) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        {isVerifyingPayment && (
          <Alert>
            <AlertDescription>
              Verifying your payment... Please wait.
            </AlertDescription>
          </Alert>
        )}
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
                   <div className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                     vehicle.payment_status === 'paid' ? 'bg-blue-400 text-blue-900' :
                     vehicle.payment_status === 'payment_required' 
                       ? 'bg-yellow-400 text-yellow-900' 
                       : 'bg-orange-400 text-orange-900'
                   }`}>
                     {vehicle.payment_status === 'paid' ? 'Payment Complete' :
                      vehicle.payment_status === 'payment_required' ? 'Payment Required' : 'Awaiting Seller Decision'}
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
                      <div className={`p-6 ${
                        vehicle.payment_status === 'paid' ? 'bg-blue-50' : 
                        vehicle.payment_status === 'payment_required' ? 'bg-green-50' : 'bg-orange-50'
                      }`}>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Seller Information</h3>
                        
                        <div className="text-center mb-6">
                          {vehicle.payment_status === 'paid' ? (
                            <>
                              <div className="flex items-center justify-center gap-2 text-blue-600 mb-2">
                                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                  <div className="w-2 h-2 bg-white rounded-full"></div>
                                </div>
                                <span className="font-semibold">Payment Complete!</span>
                              </div>
                              <p className="text-sm text-gray-600 mb-4">
                                Payment successful! You can now contact the seller to arrange pickup.
                              </p>
                            </>
                          ) : vehicle.payment_status === 'payment_required' ? (
                            <>
                              <div className="flex items-center justify-center gap-2 text-green-600 mb-2">
                                <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                  <div className="w-2 h-2 bg-white rounded-full"></div>
                                </div>
                                <span className="font-semibold">Bid Accepted!</span>
                              </div>
                              <p className="text-sm text-gray-600 mb-4">
                                Seller has accepted your bid - Payment required. You can now pay the platform fee to complete the purchase.
                              </p>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center justify-center gap-2 text-orange-600 mb-2">
                                <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                                  <div className="w-2 h-2 bg-white rounded-full"></div>
                                </div>
                                <span className="font-semibold">Awaiting Seller Decision</span>
                              </div>
                              <p className="text-sm text-gray-600 mb-4">
                                We're waiting for the seller to accept your winning bid. You'll be notified once they make their decision.
                              </p>
                            </>
                          )}
                        </div>

                        <div className="space-y-3">
                          {(() => {
                            console.log("Vehicle payment debug:", {
                              id: vehicle.id,
                              payment_status: vehicle.payment_status,
                              seller_details_unlocked: vehicle.seller_details_unlocked,
                              car_id: vehicle.car_id
                            });
                            return null;
                          })()}
                          
                          {vehicle.payment_status === 'paid' && vehicle.seller_details_unlocked ? (
                            <SellerContactInfo vehicleId={vehicle.car_id} />
                          
                          ) : vehicle.payment_status === 'payment_required' ? (
                            <>
                              <Button 
                                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold"
                                size="lg"
                                onClick={() => handlePayment(vehicle.id, calculatedPlatformFee)}
                                disabled={paymentLoading === vehicle.id}
                              >
                                <span className="mr-2">💳</span>
                                {paymentLoading === vehicle.id ? 'Processing...' : `Pay ${formatCurrency(calculatedPlatformFee)}`}
                              </Button>
                              
                              <Button 
                                variant="outline" 
                                className="w-full text-red-600 border-red-200 hover:bg-red-50"
                                size="sm"
                                onClick={async () => {
                                  try {
                                    const { data, error } = await supabase.functions.invoke('verify-payment-status', {
                                      body: {
                                        vehicleId: vehicle.id,
                                      },
                                    });

                                    if (error) throw error;

                                    if (data?.success && data?.payment_status === 'paid') {
                                      toast({
                                        title: "Payment Status Updated",
                                        description: "Payment confirmed! Seller details are now available.",
                                      });
                                      await refetch();
                                    } else {
                                      toast({
                                        title: "No Payment Found",
                                        description: "Payment is still pending or not completed.",
                                      });
                                    }
                                  } catch (error) {
                                    console.error('Error refreshing payment status:', error);
                                    toast({
                                      title: "Error",
                                      description: "Failed to refresh payment status. Please try again.",
                                      variant: "destructive",
                                    });
                                  }
                                }}
                              >
                                Refresh Payment Status
                              </Button>
                            </>
                          ) : (
                            <Button 
                              variant="outline" 
                              className="w-full text-orange-600 border-orange-200 hover:bg-orange-50"
                              size="sm"
                              onClick={handleRefresh}
                            >
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Check Status
                            </Button>
                          )}
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
