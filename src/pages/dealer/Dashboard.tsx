import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import VehicleCard from "@/components/VehicleCard";
import { useToast } from "@/components/ui/use-toast";
import { RealtimeChannel } from "@supabase/supabase-js";

interface Car {
  id: string;
  title: string;
  price: number;
  images: string[];
  make: string;
  model: string;
  year: number;
  status: string;
  mileage: number;
  transmission: string | null;
}

interface Bid {
  id: string;
  car_id: string;
  amount: number;
  status: string;
  created_at: string;
}

const DealerDashboard = () => {
  const [cars, setCars] = useState<Car[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
    };
    checkAuth();
  }, [navigate]);

  // Fetch initial cars and bids data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch available cars
        const { data: carsData, error: carsError } = await supabase
          .from("cars")
          .select("*")
          .eq("status", "available");

        if (carsError) throw carsError;
        setCars(carsData || []);

        // Fetch dealer's bids
        const { data: dealerData, error: dealerError } = await supabase
          .from("dealers")
          .select("id")
          .single();

        if (dealerError) throw dealerError;

        const { data: bidsData, error: bidsError } = await supabase
          .from("bids")
          .select("*")
          .eq("dealer_id", dealerData.id);

        if (bidsError) throw bidsError;
        setBids(bidsData || []);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  // Set up real-time subscriptions
  useEffect(() => {
    let carsChannel: RealtimeChannel;
    let bidsChannel: RealtimeChannel;

    const setupRealtimeSubscriptions = async () => {
      // Subscribe to cars changes
      carsChannel = supabase
        .channel('cars_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'cars',
          },
          (payload) => {
            if (payload.eventType === 'INSERT' && payload.new.status === 'available') {
              setCars(prev => [...prev, payload.new as Car]);
              toast({
                title: "New Listing",
                description: `New vehicle listed: ${payload.new.make} ${payload.new.model}`,
              });
            } else if (payload.eventType === 'UPDATE') {
              setCars(prev => prev.map(car => 
                car.id === payload.new.id ? { ...car, ...payload.new } : car
              ));
            } else if (payload.eventType === 'DELETE') {
              setCars(prev => prev.filter(car => car.id !== payload.old.id));
            }
          }
        )
        .subscribe();

      // Get dealer ID for bid subscription
      const { data: dealerData } = await supabase
        .from("dealers")
        .select("id")
        .single();

      if (dealerData) {
        // Subscribe to bids changes
        bidsChannel = supabase
          .channel('bids_changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'bids',
              filter: `dealer_id=eq.${dealerData.id}`,
            },
            (payload) => {
              if (payload.eventType === 'INSERT') {
                setBids(prev => [...prev, payload.new as Bid]);
              } else if (payload.eventType === 'UPDATE') {
                setBids(prev => prev.map(bid => 
                  bid.id === payload.new.id ? { ...bid, ...payload.new } : bid
                ));
                // Notify dealer about bid status changes
                if (payload.new.status !== payload.old.status) {
                  toast({
                    title: "Bid Status Updated",
                    description: `Your bid has been ${payload.new.status}`,
                    variant: payload.new.status === 'accepted' ? 'default' : 'destructive',
                  });
                }
              }
            }
          )
          .subscribe();
      }
    };

    setupRealtimeSubscriptions();

    // Cleanup subscriptions
    return () => {
      if (carsChannel) supabase.removeChannel(carsChannel);
      if (bidsChannel) supabase.removeChannel(bidsChannel);
    };
  }, [toast]);

  const handlePlaceBid = async (carId: string, amount: number) => {
    try {
      const { data: dealerData, error: dealerError } = await supabase
        .from("dealers")
        .select("id")
        .single();

      if (dealerError) throw dealerError;

      const { error: bidError } = await supabase
        .from("bids")
        .insert([
          {
            car_id: carId,
            dealer_id: dealerData.id,
            amount: amount,
            status: 'pending',
          },
        ]);

      if (bidError) throw bidError;

      toast({
        title: "Success",
        description: "Bid placed successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to place bid",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Available Vehicles</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cars.map((car) => (
              <div key={car.id} className="relative">
                <VehicleCard
                  image={car.images?.[0] || "/placeholder.svg"}
                  name={`${car.year} ${car.make} ${car.model}`}
                  price={Number(car.price)}
                  mileage={car.mileage}
                  year={car.year}
                  transmission={car.transmission}
                />
                <button
                  onClick={() => handlePlaceBid(car.id, car.price)}
                  className="absolute bottom-4 right-4 bg-primary text-white px-4 py-2 rounded hover:bg-primary/90 transition-colors"
                >
                  Place Bid
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4">Your Bids</h2>
          <div className="bg-white rounded-lg shadow p-4">
            {bids.length > 0 ? (
              <div className="space-y-4">
                {bids.map((bid) => {
                  const car = cars.find(c => c.id === bid.car_id);
                  return (
                    <div key={bid.id} className="flex justify-between items-center p-4 border rounded">
                      <div>
                        <p className="font-semibold">{car ? `${car.year} ${car.make} ${car.model}` : 'Vehicle'}</p>
                        <p className="text-sm text-gray-600">Bid Amount: ${bid.amount.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">Status: {bid.status}</p>
                      </div>
                      <div className={`px-3 py-1 rounded ${
                        bid.status === 'accepted' ? 'bg-green-100 text-green-800' :
                        bid.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {bid.status}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No bids placed yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealerDashboard;
