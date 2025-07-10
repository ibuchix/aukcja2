
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Lock, Eye, CreditCard, Car, CheckCircle, Loader2, Clock, X, Check } from "lucide-react";
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
  // Seller decision fields
  seller_decision?: 'accepted' | 'declined' | null;
  seller_decided_at?: string | null;
  // Enhanced car details for modal
  car_details?: {
    vin?: string;
    fuel_type?: string;
    transmission?: string;
    features?: Record<string, any>;
    registration_number?: string;
    seller_notes?: string;
    reserve_price?: number;
    number_of_keys?: number;
    has_service_history?: boolean;
    service_history_type?: string;
    is_damaged?: boolean;
    seat_material?: string;
  };
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
      
      // First query: Get dealer won vehicles with car details
      const { data: wonVehiclesData, error: vehiclesError } = await supabase
        .from('dealer_won_vehicles')
        .select(`
          *,
          cars!inner (
            seller_name,
            mobile_number,
            address,
            vin,
            fuel_type,
            transmission,
            features,
            registration_number,
            seller_notes,
            reserve_price,
            number_of_keys,
            has_service_history,
            service_history_type,
            is_damaged,
            seat_material
          )
        `)
        .order('created_at', { ascending: false });

      if (vehiclesError) {
        console.error('Supabase error:', vehiclesError);
        throw vehiclesError;
      }
      
      console.log('Won vehicles data:', wonVehiclesData);
      
      // Get car IDs for seller decisions query
      const carIds = wonVehiclesData?.map((item: any) => item.car_id) || [];
      
      // Second query: Get seller decisions for these cars
      let sellerDecisionsData: any[] = [];
      if (carIds.length > 0) {
        const { data, error: decisionsError } = await supabase
          .from('seller_bid_decisions')
          .select('car_id, decision, decided_at')
          .in('car_id', carIds);
        
        if (decisionsError) {
          console.error('Seller decisions error:', decisionsError);
          // Don't throw here, just log - we can still show vehicles without decisions
        } else {
          sellerDecisionsData = data || [];
        }
      }
      
      console.log('Seller decisions data:', sellerDecisionsData);
      
      // Process data safely with proper type checking
      const processedData: WonVehicle[] = [];
      
      if (Array.isArray(wonVehiclesData)) {
        // Filter valid items first, then process them
        const validItems = wonVehiclesData.filter(isValidWonVehicleData);
        
        validItems.forEach((item: any) => {
          // Find matching seller decision
          const sellerDecisionData = sellerDecisionsData.find(
            (decision: any) => decision.car_id === item.car_id
          ) || null;

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
            // Seller decision fields
            seller_decision: sellerDecisionData?.decision || null,
            seller_decided_at: sellerDecisionData?.decided_at || null,
            // Enhanced car details
            car_details: {
              vin: item.cars?.vin,
              fuel_type: item.cars?.fuel_type,
              transmission: item.cars?.transmission,
              features: item.cars?.features,
              registration_number: item.cars?.registration_number,
              seller_notes: item.cars?.seller_notes,
              reserve_price: item.cars?.reserve_price,
              number_of_keys: item.cars?.number_of_keys,
              has_service_history: item.cars?.has_service_history,
              service_history_type: item.cars?.service_history_type,
              is_damaged: item.cars?.is_damaged,
              seat_material: item.cars?.seat_material,
            },
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
      
      // Simply refresh the vehicles data to get updated seller decisions
      await fetchWonVehicles();
      
      // Find the updated vehicle to check its status
      const updatedVehicle = wonVehicles.find(v => v.id === vehicleId);
      
      if (updatedVehicle) {
        const sellerStatus = getSellerDecisionStatus(updatedVehicle);
        
        if (sellerStatus.status === 'accepted') {
          toast({
            title: "Seller Decision Updated!",
            description: "The seller has accepted your bid. You can now proceed with payment.",
            variant: "default",
          });
        } else if (sellerStatus.status === 'declined') {
          toast({
            title: "Seller Decision Updated",
            description: "Unfortunately, the seller has declined your bid.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Status Refreshed",
            description: "Still awaiting seller decision. We'll notify you once the seller responds.",
            variant: "default",
          });
        }
      } else {
        toast({
          title: "Status Refreshed",
          description: "Vehicle data has been updated.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Error refreshing status:', error);
      toast({
        title: "Refresh Error",
        description: "Could not refresh status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRefreshingPayment(null);
    }
  };

  // Helper function to get seller decision status
  const getSellerDecisionStatus = (vehicle: WonVehicle) => {
    if (vehicle.seller_decision === 'accepted') {
      return { status: 'accepted', message: 'Seller has accepted your bid', canPay: true };
    } else if (vehicle.seller_decision === 'declined') {
      return { status: 'declined', message: 'Seller has declined your bid', canPay: false };
    } else {
      return { status: 'pending', message: 'Awaiting seller decision', canPay: false };
    }
  };

  // Vehicle Details Modal Component
  const VehicleDetailsModal = ({ vehicle }: { vehicle: WonVehicle }) => {
    const renderFeature = (key: string, value: any) => {
      if (value === null || value === undefined || value === '') return null;
      
      return (
        <div key={key} className="flex justify-between py-2 border-b border-accent/30">
          <span className="text-subtitle-text capitalize">{key.replace(/_/g, ' ')}</span>
          <span className="text-body-text font-medium">
            {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}
          </span>
        </div>
      );
    };

    return (
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-oswald">
            {vehicle.vehicle_year} {vehicle.vehicle_make} {vehicle.vehicle_model}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Images Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Vehicle Images</h3>
            <div className="grid grid-cols-1 gap-3">
              {Array.isArray(vehicle.vehicle_images) && vehicle.vehicle_images.length > 0 ? 
                vehicle.vehicle_images.map((image, index) => (
                  <img 
                    key={index}
                    src={image} 
                    alt={`${vehicle.vehicle_make} ${vehicle.vehicle_model} - ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg border border-accent"
                  />
                )) : (
                  <div className="w-full h-48 bg-accent/50 rounded-lg flex items-center justify-center">
                    <Car className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}
            </div>
          </div>

          {/* Vehicle Details Section */}
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="font-semibold text-lg mb-3">Basic Information</h3>
              <div className="space-y-1">
                {renderFeature('VIN', vehicle.car_details?.vin)}
                {renderFeature('Registration Number', vehicle.car_details?.registration_number)}
                {renderFeature('Year', vehicle.vehicle_year)}
                {renderFeature('Make', vehicle.vehicle_make)}
                {renderFeature('Model', vehicle.vehicle_model)}
                {renderFeature('Mileage', vehicle.vehicle_mileage ? `${vehicle.vehicle_mileage.toLocaleString()} km` : null)}
              </div>
            </div>

            {/* Technical Specifications */}
            <div>
              <h3 className="font-semibold text-lg mb-3">Technical Specifications</h3>
              <div className="space-y-1">
                {renderFeature('Fuel Type', vehicle.car_details?.fuel_type)}
                {renderFeature('Transmission', vehicle.car_details?.transmission)}
                {renderFeature('Seat Material', vehicle.car_details?.seat_material)}
                {renderFeature('Number of Keys', vehicle.car_details?.number_of_keys)}
                {renderFeature('Has Service History', vehicle.car_details?.has_service_history)}
                {renderFeature('Service History Type', vehicle.car_details?.service_history_type)}
                {renderFeature('Is Damaged', vehicle.car_details?.is_damaged)}
              </div>
            </div>

            {/* Financial Information */}
            <div>
              <h3 className="font-semibold text-lg mb-3">Financial Information</h3>
              <div className="space-y-1">
                {renderFeature('Reserve Price', vehicle.car_details?.reserve_price ? formatCurrency(vehicle.car_details.reserve_price) : null)}
                {renderFeature('Final Price', formatCurrency(vehicle.winning_bid_amount))}
                {renderFeature('Platform Fee', formatCurrency(calculatePlatformFee(vehicle.winning_bid_amount)))}
              </div>
            </div>

            {/* Features */}
            {vehicle.car_details?.features && Object.keys(vehicle.car_details.features).length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-3">Features</h3>
                <div className="space-y-1">
                  {Object.entries(vehicle.car_details.features).map(([key, value]) => 
                    renderFeature(key, value)
                  )}
                </div>
              </div>
            )}

            {/* Seller Notes */}
            {vehicle.car_details?.seller_notes && (
              <div>
                <h3 className="font-semibold text-lg mb-3">Seller Notes</h3>
                <p className="text-body-text bg-accent/30 p-3 rounded-lg">
                  {vehicle.car_details.seller_notes}
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    );
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
                    variant={(() => {
                      const sellerStatus = getSellerDecisionStatus(vehicle);
                      if (sellerStatus.status === 'declined') return 'destructive';
                      if (sellerStatus.status === 'pending') return 'warning';
                      if (sellerStatus.status === 'accepted' && vehicle.payment_status === 'paid') return 'success';
                      return 'warning';
                    })()}
                    className="shrink-0 font-medium"
                  >
                    {(() => {
                      const sellerStatus = getSellerDecisionStatus(vehicle);
                      if (sellerStatus.status === 'declined') return 'Bid Declined';
                      if (sellerStatus.status === 'pending') return 'Awaiting Decision';
                      if (sellerStatus.status === 'accepted' && vehicle.payment_status === 'paid') return 'Access Granted';
                      return 'Payment Required';
                    })()}
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
                      {(() => {
                        const sellerStatus = getSellerDecisionStatus(vehicle);
                        
                        // Only show seller details if seller accepted AND payment is complete
                        if (sellerStatus.status === 'accepted' && vehicle.payment_status === 'paid' && vehicle.seller_details_unlocked) {
                          return (
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
                          );
                        }
                        
                        // All other cases handled below
                        if (sellerStatus.status === 'declined') {
                          return (
                            <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-lg border border-red-200 text-center h-full flex flex-col justify-center">
                              <div className="flex items-center justify-center text-red-600 mb-3">
                                <X className="w-6 h-6 mr-2" />
                                <span className="font-medium">Sale Declined</span>
                              </div>
                              <p className="text-sm text-red-700 leading-relaxed">
                                {sellerStatus.message}. No payment is required.
                              </p>
                            </div>
                          );
                        }
                        
                        if (sellerStatus.status === 'pending') {
                          return (
                            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-lg border border-yellow-200 text-center h-full flex flex-col justify-center">
                              <div className="flex items-center justify-center text-yellow-600 mb-3">
                                <Clock className="w-6 h-6 mr-2" />
                                <span className="font-medium">Awaiting Seller Decision</span>
                              </div>
                              <p className="text-sm text-yellow-700 mb-4 leading-relaxed">
                                {sellerStatus.message}. Payment will be available once the seller accepts.
                              </p>
                              <Button 
                                variant="outline"
                                onClick={() => handleRefreshPaymentStatus(vehicle.id)}
                                disabled={refreshingPayment === vehicle.id}
                                className="w-full border-yellow-400 text-yellow-700 hover:bg-yellow-50"
                                size="sm"
                              >
                                {refreshingPayment === vehicle.id ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Checking...
                                  </>
                                ) : (
                                  "Check Status"
                                )}
                              </Button>
                            </div>
                          );
                        }
                        
                        // Seller accepted - show payment option
                        return (
                          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200 text-center h-full flex flex-col justify-center">
                            <div className="flex items-center justify-center text-green-600 mb-3">
                              <Check className="w-6 h-6 mr-2" />
                              <span className="font-medium">Bid Accepted!</span>
                            </div>
                            <p className="text-sm text-green-700 mb-4 leading-relaxed">
                              {sellerStatus.message}. You can now pay the platform fee to complete the purchase.
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
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 pt-4 border-t border-accent">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="w-full border-primary/20 text-primary hover:bg-primary/5"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Full Details
                      </Button>
                    </DialogTrigger>
                    <VehicleDetailsModal vehicle={vehicle} />
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
