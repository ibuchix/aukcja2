import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WishlistItem {
  id: string;
  dealer_id: string;
  car_id: string;
  created_at: string;
  expires_at: string;
}

export const useWishlist = (dealerId?: string) => {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchWishlist = async () => {
    if (!dealerId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('dealer_wishlists')
        .select('*')
        .eq('dealer_id', dealerId)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWishlist((data as any) || []);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      toast({
        variant: 'destructive',
        title: 'Błąd',
        description: 'Nie udało się pobrać listy życzeń',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, [dealerId]);

  const isInWishlist = (carId: string) => {
    return wishlist.some((item) => item.car_id === carId);
  };

  const addToWishlist = async (carId: string) => {
    if (!dealerId) {
      toast({
        variant: 'destructive',
        title: 'Błąd',
        description: 'Musisz być zalogowany jako dealer',
      });
      return false;
    }

    // Check 20-item limit
    if (wishlist.length >= 20) {
      toast({
        variant: 'destructive',
        title: 'Limit osiągnięty',
        description: 'Możesz mieć maksymalnie 20 pojazdów na liście życzeń',
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('dealer_wishlists')
        .insert({
          dealer_id: dealerId,
          car_id: carId,
        });

      if (error) {
        // Check if it's a duplicate entry error
        if (error.code === '23505') {
          toast({
            title: 'Informacja',
            description: 'Ten pojazd jest już na Twojej liście życzeń',
          });
          return false;
        }
        throw error;
      }

      await fetchWishlist();
      toast({
        title: 'Sukces',
        description: 'Dodano do listy życzeń',
      });
      return true;
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      toast({
        variant: 'destructive',
        title: 'Błąd',
        description: 'Nie udało się dodać do listy życzeń',
      });
      return false;
    }
  };

  const removeFromWishlist = async (carId: string) => {
    if (!dealerId) return false;

    try {
      const { error } = await supabase
        .from('dealer_wishlists')
        .delete()
        .eq('dealer_id', dealerId)
        .eq('car_id', carId);

      if (error) throw error;

      await fetchWishlist();
      toast({
        title: 'Usunięto',
        description: 'Usunięto z listy życzeń',
      });
      return true;
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      toast({
        variant: 'destructive',
        title: 'Błąd',
        description: 'Nie udało się usunąć z listy życzeń',
      });
      return false;
    }
  };

  const toggleWishlist = async (carId: string) => {
    if (isInWishlist(carId)) {
      return await removeFromWishlist(carId);
    } else {
      return await addToWishlist(carId);
    }
  };

  return {
    wishlist,
    loading,
    isInWishlist,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    wishlistCount: wishlist.length,
    refreshWishlist: fetchWishlist,
  };
};
