
import React, { useEffect, useState } from 'react';
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
  minimumIncrement?: number; // Made optional since we're allowing any increment
  reservePrice?: number;
  isVerified?: boolean;
}

export const SimpleBidManager = ({
  carId,
  dealerId,
  currentHighestBid,
  minimumIncrement = 1, // Set to 1 PLN as absolute minimum
  reservePrice,
  isVerified = true,
}: SimpleBidManagerProps) => {
  const [bidAmount, setBidAmount] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [myBid, setMyBid] = useState<number | null>(null);

  const fetchMyBid = async () => {
    if (!isVerified) return;
    const { data, error } = await supabase
      .from('bids')
      .select('amount')
      .eq('car_id', carId)
      .eq('dealer_id', dealerId)
      .order('amount', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      const row = data as any;
      if (row && typeof row.amount !== 'undefined' && row.amount !== null) {
        setMyBid(Number(row.amount));
      } else {
        setMyBid(null);
      }
    } else {
      setMyBid(null);
    }
  };

  useEffect(() => {
    fetchMyBid();
  }, [carId, dealerId, isVerified]);

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

    if (numericBidAmount <= 0) {
      toast({
        title: "Invalid bid amount",
        description: "Bid amount must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    // Removed minimum bid restrictions - dealers can bid any positive amount

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.rpc('place_bid', {
        p_car_id: carId,
        p_dealer_id: dealerId,
        p_amount: numericBidAmount
      });

      if (error) throw error;

      // Type-safe access to response data
      const response = data as any;
      if (response?.success) {
        toast({
          title: "Bid placed successfully",
          description: `Your bid of ${formatCurrency(numericBidAmount)} has been placed`,
        });
        setBidAmount("");
        await fetchMyBid();
        // The parent component should handle refreshing the data
      } else {
        throw new Error(response?.error || "Failed to place bid");
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
          Złóż ofertę
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Latest bid: <span className="font-semibold">{formatCurrency(currentHighestBid)}</span>
            </p>
            {myBid !== null && (
              <p className="text-sm text-muted-foreground mb-2">
                Twoja ostatnia oferta:
                <span className="ml-1 inline-flex items-center rounded border border-green-200 bg-green-100 px-2 py-0.5 font-semibold text-green-800">
                  {formatCurrency(myBid)}
                </span>
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Wprowadź kwotę, którą chcesz zapłacić za ten pojazd. Nasz system licytacji automatycznej będzie podbijał ofertę w krokach co 250 PLN, aż do osiągnięcia tej kwoty.
            </p>
            {reservePrice && (
              <p className="text-xs text-muted-foreground">
                Cena orientacyjna: {formatCurrency(reservePrice)}
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <label htmlFor="bidAmount" className="block text-sm font-medium">
              Twoja oferta (PLN)
            </label>
            <Input
              id="bidAmount"
              type="number"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              min="1"
              step="1"
              placeholder="Wprowadź swoją ofertę"
              disabled={isSubmitting}
            />
          </div>

          <Button
            onClick={handlePlaceBid}
            disabled={isSubmitting || !bidAmount || parseFloat(bidAmount) <= 0}
            className="w-full"
          >
            {isSubmitting ? "Składanie oferty..." : "Złóż ofertę"}
          </Button>
          <div className="mt-4 flex flex-col items-center">
            <a
              href="https://www.carvertical.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="carvertical VIN check"
            >
              <img
                src="//carvertical.postaffiliatepro.com/accounts/default1/3wboofl3y7q/d7aece8a.jpg"
                alt="carvertical VIN check"
                title="carvertical VIN check"
                width={300}
                height={300}
                loading="lazy"
                decoding="async"
              />
            </a>
            <img
              style={{ border: 0 }}
              src="https://carvertical.postaffiliatepro.com/scripts/3wioofl3y7q?a=66c6155b1b60f&b=d7aece8a"
              width={1}
              height={1}
              alt=""
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
