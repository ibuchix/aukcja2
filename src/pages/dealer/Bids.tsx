import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";

interface Bid {
  id: string;
  car_id: string;
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
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchBids = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate('/auth');
          return;
        }

        const { data: dealerData, error: dealerError } = await supabase
          .from('dealers')
          .select('id')
          .eq('user_id', session.user.id)
          .single();

        if (dealerError || !dealerData) {
          throw new Error('Could not find dealer profile');
        }

        const { data: bidsData, error: bidsError } = await supabase
          .from('bids')
          .select(`
            *,
            car:cars (
              title,
              make,
              model,
              year
            )
          `)
          .eq('dealer_id', dealerData.id)
          .order('created_at', { ascending: false });

        if (bidsError) throw bidsError;
        setBids(bidsData);
      } catch (error) {
        console.error('Error fetching bids:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load bids"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBids();
  }, [navigate, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">My Bids</h1>
        <div className="grid gap-6">
          {bids.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-subtitle-text">No bids found</p>
              </CardContent>
            </Card>
          ) : (
            bids.map((bid) => (
              <Card key={bid.id}>
                <CardHeader>
                  <CardTitle>
                    {bid.car.year} {bid.car.make} {bid.car.model}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-subtitle-text">Bid Amount</p>
                      <p className="font-semibold">${bid.amount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-subtitle-text">Status</p>
                      <p className="font-semibold capitalize">{bid.status}</p>
                    </div>
                    <div>
                      <p className="text-sm text-subtitle-text">Date</p>
                      <p className="font-semibold">
                        {format(new Date(bid.created_at), 'PPp')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}