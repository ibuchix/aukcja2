
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Info, DollarSign, AlertTriangle } from "lucide-react";
import { executeWithRetry } from "@/utils/retryUtils";

interface ProxyBidManagerProps {
  carId: string;
  dealerId: string;
  currentHighestBid: number;
  minimumIncrement: number;
}

export const ProxyBidManager = ({
  carId,
  dealerId,
  currentHighestBid,
  minimumIncrement,
}: ProxyBidManagerProps) => {
  const [maxBid, setMaxBid] = useState<string>("");
  const [existingProxyBid, setExistingProxyBid] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Fetch existing proxy bid for this car
  useEffect(() => {
    const fetchProxyBid = async () => {
      try {
        const { data, error } = await executeWithRetry(() => 
          supabase
            .from('proxy_bids')
            .select('max_bid_amount')
            .eq('car_id', carId)
            .eq('dealer_id', dealerId)
            .single()
        );

        if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" which is fine
          throw error;
        }

        if (data) {
          setExistingProxyBid(data.max_bid_amount);
          setMaxBid(data.max_bid_amount.toString());
        }
      } catch (error) {
        console.error("Error fetching proxy bid:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (carId && dealerId) {
      fetchProxyBid();
    }
  }, [carId, dealerId]);

  const handleSetMaxBid = async () => {
    if (isSubmitting) return; // Prevent multiple submissions
    
    try {
      setIsSubmitting(true);
      const numericMaxBid = parseFloat(maxBid);
      if (isNaN(numericMaxBid)) {
        throw new Error("Please enter a valid number");
      }

      if (numericMaxBid <= currentHighestBid) {
        throw new Error(`Bid must be higher than current bid of $${currentHighestBid}`);
      }

      // Check if the bid is divisible by the minimum increment
      if (numericMaxBid % minimumIncrement !== 0) {
        throw new Error(`Bid must be divisible by the minimum increment of $${minimumIncrement}`);
      }

      // Use upsert with onConflict to handle concurrent submissions
      const { error } = await executeWithRetry(() => 
        supabase
          .from('proxy_bids')
          .upsert({
            car_id: carId,
            dealer_id: dealerId,
            max_bid_amount: numericMaxBid,
          }, {
            onConflict: 'car_id,dealer_id'
          })
      );

      if (error) throw error;

      setExistingProxyBid(numericMaxBid);
      
      toast({
        title: "Maximum Bid Set",
        description: `Your maximum bid of $${numericMaxBid.toLocaleString()} has been set successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to set maximum bid",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveMaxBid = async () => {
    if (isSubmitting) return; // Prevent multiple submissions
    
    try {
      setIsSubmitting(true);
      const { error } = await executeWithRetry(() => 
        supabase
          .from('proxy_bids')
          .delete()
          .eq('car_id', carId)
          .eq('dealer_id', dealerId)
      );

      if (error) throw error;

      setExistingProxyBid(null);
      setMaxBid("");
      
      toast({
        title: "Maximum Bid Removed",
        description: "Your maximum bid has been removed successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove maximum bid",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full mb-4">
      <CardHeader>
        <CardTitle className="text-heading-sm font-oswald flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Proxy Bidding
        </CardTitle>
        <CardDescription>
          Set a maximum bid and our system will automatically bid for you up to that amount
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="animate-pulse">Loading...</div>
        ) : (
          <>
            <div className="mb-4 p-3 bg-muted rounded-md flex items-start gap-3">
              <Info className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="text-sm text-muted-foreground">
                Proxy bidding will automatically place bids on your behalf up to your maximum amount, 
                only bidding enough to outbid other bidders by the minimum increment.
              </div>
            </div>

            {existingProxyBid && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800">
                  You currently have a maximum bid of <strong>${existingProxyBid.toLocaleString()}</strong> set for this auction.
                  Setting a new value will replace your current maximum bid.
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Input
                type="number"
                value={maxBid}
                onChange={(e) => setMaxBid(e.target.value)}
                placeholder={`Enter maximum bid (min: $${(currentHighestBid + minimumIncrement).toLocaleString()})`}
                min={currentHighestBid + minimumIncrement}
                step={minimumIncrement}
                className="flex-1"
                disabled={isSubmitting}
              />
              <Button 
                onClick={handleSetMaxBid}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Setting..." : "Set Max Bid"}
              </Button>
              
              {existingProxyBid && (
                <Button 
                  variant="outline" 
                  onClick={handleRemoveMaxBid}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Removing..." : "Remove Max Bid"}
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
