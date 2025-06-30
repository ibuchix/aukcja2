
import React, { useState } from 'react';
import { DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils";

interface SimpleBidManagerProps {
  carId: string;
  dealerId: string;
  currentHighestBid: number;
  minimumIncrement: number;
  reservePrice?: number;
  isVerified?: boolean;
}

export const SimpleBidManager = ({
  carId,
  dealerId,
  currentHighestBid,
  minimumIncrement,
  reservePrice,
  isVerified = true,
}: SimpleBidManagerProps) => {
  const [bidAmount, setBidAmount] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Early return if dealer is not verified
  if (!isVerified) {
    return (
      <Card className="w-full mb-4">
        <CardHeader>
          <CardTitle className="text-heading-sm font-oswald flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Bidding - Verification Required
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-amber-800">
              Bidding is only available to verified dealers. Please complete your dealer verification to access this feature.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const minBidAmount = currentHighestBid + minimumIncrement;

  const handlePlaceBid = async () => {
    if (isSubmitting) return;

    const numericBidAmount = parseFloat(bidAmount);
    
    if (isNaN(numericBidAmount)) {
      toast({
        title: "Invalid bid amount",
        description: "Please enter a valid number",
        variant: "destructive",
      });
      return;
    }

    if (numericBidAmount < minBidAmount) {
      toast({
        title: "Bid too low",
        description: `Minimum bid is ${formatCurrency(minBidAmount)}`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.rpc('place_bid', {
        p_car_id: carId,
        p_dealer_id: dealerId,
        p_amount: numericBidAmount
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Bid placed successfully",
          description: `Your bid of ${formatCurrency(numericBidAmount)} has been placed`,
        });
        setBidAmount("");
        // The parent component should handle refreshing the data
      } else {
        throw new Error(data?.error || "Failed to place bid");
      }
    } catch (error) {
      toast({
        title: "Failed to place bid",
        description: error instanceof Error ? error.message : "Please try again",
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
          Place Your Bid
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Current highest bid: <span className="font-semibold">{formatCurrency(currentHighestBid)}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Minimum bid: {formatCurrency(minBidAmount)}
            </p>
            {reservePrice && (
              <p className="text-xs text-muted-foreground">
                Reserve price: {formatCurrency(reservePrice)}
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <label htmlFor="bidAmount" className="block text-sm font-medium">
              Your Bid Amount (PLN)
            </label>
            <Input
              id="bidAmount"
              type="number"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              min={minBidAmount}
              step={minimumIncrement}
              placeholder={`Enter amount (min ${formatCurrency(minBidAmount)})`}
              disabled={isSubmitting}
            />
          </div>

          <Button
            onClick={handlePlaceBid}
            disabled={isSubmitting || !bidAmount || parseFloat(bidAmount) < minBidAmount}
            className="w-full"
          >
            {isSubmitting ? "Placing Bid..." : "Place Bid"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
