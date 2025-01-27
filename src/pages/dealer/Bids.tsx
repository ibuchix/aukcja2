import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

interface Bid {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  car: {
    title: string;
    make: string;
    model: string;
    year: number;
  };
}

export default function DealerBids() {
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchBids();
  }, []);

  const fetchBids = async () => {
    try {
      const { data: dealerData, error: dealerError } = await supabase
        .from('dealers')
        .select('id')
        .single();

      if (dealerError) throw dealerError;

      const { data, error } = await supabase
        .from('bids')
        .select(`
          id,
          amount,
          status,
          created_at,
          car:cars (
            title,
            make,
            model,
            year
          )
        `)
        .eq('dealer_id', dealerData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBids(data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load bids"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">My Bids</h1>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className="grid gap-4">
            {bids.map((bid) => (
              <Card key={bid.id}>
                <CardHeader>
                  <CardTitle>{bid.car.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-subtitle-text">Vehicle</p>
                      <p>{`${bid.car.year} ${bid.car.make} ${bid.car.model}`}</p>
                    </div>
                    <div>
                      <p className="text-subtitle-text">Bid Amount</p>
                      <p>£{bid.amount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-subtitle-text">Status</p>
                      <p className="capitalize">{bid.status}</p>
                    </div>
                    <div>
                      <p className="text-subtitle-text">Date</p>
                      <p>{new Date(bid.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {bids.length === 0 && (
              <Card>
                <CardContent className="py-8">
                  <p className="text-center text-subtitle-text">No bids found</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}