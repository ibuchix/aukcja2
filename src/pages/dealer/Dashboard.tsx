import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import VehicleCard from "@/components/VehicleCard";
import { useToast } from "@/components/ui/use-toast";

interface Car {
  id: string;
  title: string;
  price: number;
  images: string[];
  make: string;
  model: string;
  year: number;
}

const DealerDashboard = () => {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
      }
    };
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    const fetchCars = async () => {
      try {
        const { data, error } = await supabase
          .from("cars")
          .select("*")
          .eq("status", "available");

        if (error) throw error;
        setCars(data || []);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch available cars",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCars();
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
        <h1 className="text-3xl font-bold mb-8">Available Vehicles</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cars.map((car) => (
            <div key={car.id} className="relative">
              <VehicleCard
                image={car.images?.[0] || "/placeholder.svg"}
                name={`${car.year} ${car.make} ${car.model}`}
                price={`$${car.price.toLocaleString()}`}
                specs={{
                  speed: "N/A",
                  acceleration: "N/A",
                  power: "N/A",
                }}
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
    </div>
  );
};

export default DealerDashboard;