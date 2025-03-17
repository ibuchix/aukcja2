
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Heart, HeartOff, Loader2 } from "lucide-react";

interface AuctionWatchlistButtonProps {
  carId: string;
  dealerId: string;
}

export const AuctionWatchlistButton = ({
  carId,
  dealerId,
}: AuctionWatchlistButtonProps) => {
  const [isWatchlisted, setIsWatchlisted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();

  useEffect(() => {
    const checkWatchlistStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('dealer_watchlist')
          .select('id')
          .eq('car_id', carId)
          .eq('buyer_id', dealerId)
          .maybeSingle();

        if (error) throw error;
        setIsWatchlisted(!!data);
      } catch (error) {
        console.error("Error checking watchlist status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (carId && dealerId) {
      checkWatchlistStatus();
    }
  }, [carId, dealerId]);

  const toggleWatchlist = async () => {
    setIsLoading(true);
    try {
      if (isWatchlisted) {
        // Remove from watchlist
        const { error } = await supabase
          .from('dealer_watchlist')
          .delete()
          .eq('car_id', carId)
          .eq('buyer_id', dealerId);

        if (error) throw error;
        setIsWatchlisted(false);
        toast({
          title: "Removed from watchlist",
          description: "This auction has been removed from your watchlist",
          variant: "default",
        });
      } else {
        // Add to watchlist
        const { error } = await supabase
          .from('dealer_watchlist')
          .insert({
            car_id: carId,
            buyer_id: dealerId,
          });

        if (error) throw error;
        setIsWatchlisted(true);
        toast({
          title: "Added to watchlist",
          description: "This auction has been added to your watchlist",
          variant: "default",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update watchlist",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleWatchlist}
      className={isWatchlisted ? "text-red-500 hover:text-red-700" : ""}
    >
      {isWatchlisted ? (
        <>
          <HeartOff className="h-4 w-4 mr-2" />
          Remove from Watchlist
        </>
      ) : (
        <>
          <Heart className="h-4 w-4 mr-2" />
          Add to Watchlist
        </>
      )}
    </Button>
  );
};
