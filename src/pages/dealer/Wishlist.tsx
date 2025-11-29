import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useWishlist } from '@/hooks/useWishlist';
import { DashboardLayout } from '@/components/dealer/dashboard/DashboardLayout';
import { LiveAuctionCard } from '@/components/dealer/cars/LiveAuctionCard';
import { Heart } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { pl } from 'date-fns/locale';

const Wishlist = () => {
  const navigate = useNavigate();
  const [dealerId, setDealerId] = useState<string | null>(null);
  const [cars, setCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { wishlist, loading: wishlistLoading } = useWishlist(dealerId || undefined);

  useEffect(() => {
    const fetchDealerProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: dealer } = await supabase
        .from('dealers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (dealer) {
        setDealerId((dealer as any).id);
      }
    };

    fetchDealerProfile();
  }, [navigate]);

  useEffect(() => {
    const fetchWishlistCars = async () => {
      if (!wishlist.length) {
        setLoading(false);
        return;
      }

      try {
        const carIds = wishlist.map((item: any) => item.car_id);
        
        const { data, error } = await supabase
          .from('cars')
          .select(`
            *,
            auction_schedules!inner (
              id,
              start_time,
              end_time,
              status
            )
          `)
          .in('id', carIds)
          .eq('is_auction', true);

        if (error) throw error;

        // Merge expiration data from wishlist
        const carsWithExpiration = ((data as any) || []).map((car: any) => {
          const wishlistItem = wishlist.find((item: any) => item.car_id === car.id);
          return {
            ...car,
            wishlist_expires_at: wishlistItem?.expires_at,
          };
        });

        setCars(carsWithExpiration);
      } catch (error) {
        console.error('Error fetching wishlist cars:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!wishlistLoading) {
      fetchWishlistCars();
    }
  }, [wishlist, wishlistLoading]);

  const handleCarClick = (car: any) => {
    navigate(`/dealer/dashboard?carId=${car.id}`);
  };

  const getExpirationText = (expiresAt: string) => {
    try {
      return formatDistanceToNow(new Date(expiresAt), {
        addSuffix: true,
        locale: pl,
      });
    } catch {
      return 'wkrótce';
    }
  };

  if (loading || wishlistLoading) {
    return (
      <DashboardLayout title="Moja Lista Życzeń">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Ładowanie...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Moja Lista Życzeń">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Heart className="h-8 w-8 text-destructive fill-destructive" />
          <h1 className="text-3xl font-bold text-foreground">
            Moja Lista Życzeń
          </h1>
        </div>
        <p className="text-muted-foreground">
          {wishlist.length} {wishlist.length === 1 ? 'pojazd' : 'pojazdów'} na liście (maksymalnie 20)
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Lista życzeń wygasa po 7 dniach od dodania pojazdu
        </p>
      </div>

      {cars.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-card rounded-lg border border-border">
          <Heart className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Brak pojazdów na liście życzeń
          </h3>
          <p className="text-muted-foreground text-center max-w-md mb-6">
            Dodaj pojazdy do listy życzeń, klikając ikonę serca na kartach aukcji.
            Możesz dodać do 20 pojazdów.
          </p>
          <button
            onClick={() => navigate('/dealer/dashboard')}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Przeglądaj Aukcje
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cars.map((car) => (
            <div key={car.id} className="relative">
              <LiveAuctionCard
                car={car}
                dealerId={dealerId || ''}
                onClick={handleCarClick}
              />
              {car.wishlist_expires_at && (
                <div className="mt-2 text-xs text-muted-foreground text-center">
                  Wygasa {getExpirationText(car.wishlist_expires_at)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default Wishlist;
