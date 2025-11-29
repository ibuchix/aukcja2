import React, { createContext, useContext, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { queryKeys } from '@/utils/queryClient';

interface WishlistItem {
  id: string;
  dealer_id: string;
  car_id: string;
  created_at: string;
  expires_at: string;
}

interface WishlistContextType {
  wishlist: WishlistItem[];
  loading: boolean;
  isInWishlist: (carId: string) => boolean;
  addToWishlist: (carId: string) => Promise<boolean>;
  removeFromWishlist: (carId: string) => Promise<boolean>;
  toggleWishlist: (carId: string) => Promise<boolean>;
  wishlistCount: number;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | null>(null);

interface WishlistProviderProps {
  children: React.ReactNode;
  dealerId?: string;
}

export const WishlistProvider: React.FC<WishlistProviderProps> = ({ children, dealerId }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch wishlist with React Query (automatic caching & deduplication)
  const { data: wishlist = [], isLoading: loading } = useQuery({
    queryKey: queryKeys.wishlist.list(dealerId || ''),
    queryFn: async () => {
      if (!dealerId) return [];

      const { data, error } = await supabase
        .from('dealer_wishlists')
        .select('*')
        .eq('dealer_id', dealerId)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as unknown) as WishlistItem[];
    },
    enabled: !!dealerId,
    staleTime: 30000, // Cache for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: true,
  });

  // Real-time subscription for wishlist changes
  useEffect(() => {
    if (!dealerId) return;

    const channel = supabase
      .channel(`wishlist-${dealerId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dealer_wishlists',
          filter: `dealer_id=eq.${dealerId}`,
        },
        () => {
          // Invalidate and refetch wishlist on any change
          queryClient.invalidateQueries({ 
            queryKey: queryKeys.wishlist.list(dealerId) 
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dealerId, queryClient]);

  // Add to wishlist mutation
  const addMutation = useMutation({
    mutationFn: async (carId: string) => {
      if (!dealerId) throw new Error('No dealer ID');

      // Check 20-item limit
      if (wishlist.length >= 20) {
        throw new Error('LIMIT_REACHED');
      }

      const { error } = await supabase
        .from('dealer_wishlists')
        .insert({
          dealer_id: dealerId,
          car_id: carId,
        });

      if (error) {
        if (error.code === '23505') {
          throw new Error('DUPLICATE');
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.wishlist.list(dealerId || '') 
      });
      toast({
        title: 'Sukces',
        description: 'Dodano do listy życzeń',
      });
    },
    onError: (error: Error) => {
      if (error.message === 'LIMIT_REACHED') {
        toast({
          variant: 'destructive',
          title: 'Limit osiągnięty',
          description: 'Możesz mieć maksymalnie 20 pojazdów na liście życzeń',
        });
      } else if (error.message === 'DUPLICATE') {
        toast({
          title: 'Informacja',
          description: 'Ten pojazd jest już na Twojej liście życzeń',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Błąd',
          description: 'Nie udało się dodać do listy życzeń',
        });
      }
    },
  });

  // Remove from wishlist mutation
  const removeMutation = useMutation({
    mutationFn: async (carId: string) => {
      if (!dealerId) throw new Error('No dealer ID');

      const { error } = await supabase
        .from('dealer_wishlists')
        .delete()
        .eq('dealer_id', dealerId)
        .eq('car_id', carId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.wishlist.list(dealerId || '') 
      });
      toast({
        title: 'Usunięto',
        description: 'Usunięto z listy życzeń',
      });
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Błąd',
        description: 'Nie udało się usunąć z listy życzeń',
      });
    },
  });

  const isInWishlist = (carId: string) => {
    return wishlist.some((item) => item.car_id === carId);
  };

  const addToWishlist = async (carId: string): Promise<boolean> => {
    if (!dealerId) {
      toast({
        variant: 'destructive',
        title: 'Błąd',
        description: 'Musisz być zalogowany jako dealer',
      });
      return false;
    }

    try {
      await addMutation.mutateAsync(carId);
      return true;
    } catch {
      return false;
    }
  };

  const removeFromWishlist = async (carId: string): Promise<boolean> => {
    if (!dealerId) return false;

    try {
      await removeMutation.mutateAsync(carId);
      return true;
    } catch {
      return false;
    }
  };

  const toggleWishlist = async (carId: string): Promise<boolean> => {
    if (isInWishlist(carId)) {
      return await removeFromWishlist(carId);
    } else {
      return await addToWishlist(carId);
    }
  };

  const refreshWishlist = async () => {
    await queryClient.invalidateQueries({ 
      queryKey: queryKeys.wishlist.list(dealerId || '') 
    });
  };

  const value: WishlistContextType = {
    wishlist,
    loading,
    isInWishlist,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    wishlistCount: wishlist.length,
    refreshWishlist,
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlistContext = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlistContext must be used within WishlistProvider');
  }
  return context;
};
