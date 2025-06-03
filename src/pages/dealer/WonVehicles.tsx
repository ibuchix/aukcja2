
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Eye, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WonVehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  finalBid: number;
  wonAt: string;
  seller_name?: string;
  seller_contact?: string;
  seller_address?: string;
  paymentStatus: 'pending' | 'paid';
}

export default function WonVehicles() {
  const [wonVehicles, setWonVehicles] = useState<WonVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
      // TODO: Fetch won vehicles from database
      // This is a placeholder - implement actual data fetching
      setWonVehicles([]);
      setLoading(false);
    };
    checkAuth();
  }, [navigate]);

  const handlePayForAccess = async (vehicleId: string) => {
    // TODO: Integrate with Stripe for payment processing
    toast({
      title: "Payment Required",
      description: "Stripe integration will be implemented to unlock seller details"
    });
  };

  const handleViewDetails = (vehicle: WonVehicle) => {
    // TODO: Open detailed view modal or navigate to details page
    toast({
      title: "Vehicle Details",
      description: `Viewing details for ${vehicle.make} ${vehicle.model}`
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          Loading won vehicles...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Won Vehicles</h1>
        
        {wonVehicles.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className="text-lg font-medium mb-2">No Won Vehicles</h3>
                <p className="text-muted-foreground">
                  You haven't won any auctions yet. Keep bidding to win your first vehicle!
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {wonVehicles.map((vehicle) => (
              <Card key={vehicle.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </CardTitle>
                    <Badge variant={vehicle.paymentStatus === 'paid' ? 'default' : 'secondary'}>
                      {vehicle.paymentStatus === 'paid' ? 'Access Granted' : 'Payment Required'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Mileage</p>
                      <p className="font-medium">{vehicle.mileage.toLocaleString()} km</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Final Bid</p>
                      <p className="font-medium">PLN {vehicle.finalBid.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Won Date</p>
                      <p className="font-medium">{new Date(vehicle.wonAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Seller Details Section */}
                  <div className="border-t pt-4 mb-4">
                    <h4 className="font-medium mb-3">Seller Information</h4>
                    {vehicle.paymentStatus === 'paid' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Seller Name</p>
                          <p className="font-medium">{vehicle.seller_name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Contact</p>
                          <p className="font-medium">{vehicle.seller_contact}</p>
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-sm text-muted-foreground">Address</p>
                          <p className="font-medium">{vehicle.seller_address}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-muted rounded-lg">
                        <div className="flex items-center justify-center text-muted-foreground mb-2">
                          <Lock className="w-5 h-5 mr-2" />
                          <span>Seller details are locked</span>
                        </div>
                        <p className="text-sm text-center text-muted-foreground mb-3">
                          Pay to unlock seller contact information and arrange pickup
                        </p>
                        <Button 
                          onClick={() => handlePayForAccess(vehicle.id)}
                          className="w-full"
                        >
                          <CreditCard className="w-4 h-4 mr-2" />
                          Pay to Unlock Details
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
