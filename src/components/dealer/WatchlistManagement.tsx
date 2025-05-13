
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Heart, HeartOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CarListing } from "@/types/cars";
import { isValidRecord, hasValidRelation } from "@/utils/supabaseHelpers";

interface WatchlistCar extends CarListing {
  watchlist_id: string;
}

interface WatchlistItem {
  id: string;
  car_id: string;
  cars?: {
    id: string;
    title?: string;
    make?: string;
    model?: string;
    year?: number;
    price?: number;
    auction_end_time?: string;
    auction_status?: string;
    is_auction?: boolean;
    reserve_price?: number;
  } | null;
}

interface WatchlistManagementProps {
  dealerId: string;
}

export const WatchlistManagement = ({ dealerId }: WatchlistManagementProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: watchlistedCars, isLoading } = useQuery({
    queryKey: ["watchlistedCars", dealerId],
    queryFn: async () => {
      const { data: watchlistData, error } = await supabase
        .from('dealer_watchlist')
        .select(`
          id,
          car_id,
          cars:car_id (
            id,
            title,
            make,
            model,
            year,
            price,
            auction_end_time,
            auction_status,
            is_auction,
            reserve_price
          )
        `)
        .eq('buyer_id', dealerId);

      if (error) throw error;
      
      // Transform and filter the response with proper type safety
      if (!watchlistData || !Array.isArray(watchlistData)) return [];
      
      return watchlistData
        .filter((item): item is WatchlistItem => 
          Boolean(item && typeof item === 'object' && 'id' in item)
        )
        .filter(item => hasValidRelation(item, 'cars'))
        .map(item => {
          const carData = item.cars;
          if (!carData) return null;
          
          return {
            ...carData,
            watchlist_id: item.id
          };
        })
        .filter((item): item is WatchlistCar => Boolean(item)); // Filter out nulls
    }
  });

  const removeFromWatchlist = useMutation({
    mutationFn: async (watchlistId: string) => {
      const { error } = await supabase
        .from('dealer_watchlist')
        .delete()
        .eq('id', watchlistId as string);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlistedCars", dealerId] });
      toast({
        title: "Car removed from watchlist",
        description: "The car has been removed from your watchlist.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to remove car from watchlist. Please try again.",
        variant: "destructive",
      });
      console.error('Error removing from watchlist:', error);
    }
  });

  if (isLoading) {
    return <div className="text-muted-foreground">Loading watchlist...</div>;
  }

  if (!watchlistedCars?.length) {
    return <div className="text-muted-foreground">No cars in watchlist.</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-heading-md font-oswald flex items-center gap-2">
          <Heart className="h-6 w-6" />
          Watchlist
        </CardTitle>
        <CardDescription>
          Cars you are interested in bidding on
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vehicle</TableHead>
              <TableHead>Auction Ends</TableHead>
              <TableHead>Reserve Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {watchlistedCars.map((car) => (
              <TableRow key={car.id}>
                <TableCell>
                  {car.year} {car.make} {car.model}
                </TableCell>
                <TableCell>
                  {car.auction_end_time ? (
                    format(new Date(car.auction_end_time), "MMM d, yyyy HH:mm")
                  ) : (
                    "N/A"
                  )}
                </TableCell>
                <TableCell>
                  ${car.reserve_price?.toLocaleString()}
                </TableCell>
                <TableCell className="capitalize">
                  {car.auction_status}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFromWatchlist.mutate(car.watchlist_id)}
                  >
                    <HeartOff className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
