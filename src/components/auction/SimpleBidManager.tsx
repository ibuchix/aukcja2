
import React, { useEffect, useState } from 'react';
import { DollarSign, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { translateErrorMessage } from "@/lib/vehicleTranslations";

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
  const [bidError, setBidError] = useState<string>("");

  const fetchMyBid = async () => {
    if (!isVerified) return;
    const { data, error } = await supabase
      .from('bids')
      .select('amount')
      .eq('car_id', carId)
      .eq('dealer_id', dealerId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
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

  // Clear error when user types a new amount
  useEffect(() => {
    if (bidAmount && bidError) {
      setBidError("");
    }
  }, [bidAmount]);

  // Early return if dealer is not verified
  if (!isVerified) {
    return (
      <Card className="w-full mb-4">
        <CardHeader>
          <CardTitle className="text-heading-sm font-kanit font-semibold flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Bidding - Verification Required
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-amber-800">
              Dostęp do licytacji mają wyłącznie zweryfikowani dealerzy. Zweryfikuj konto, aby kontynuować
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
      // Toast: Invalid Bid Amount - Bid is not a valid number
      toast({
        description: "Wprowadź prawidłową liczbę",
        variant: "destructive",
      });
      return;
    }

    if (numericBidAmount <= 0) {
      // Toast: Invalid Bid Amount - Bid must be greater than zero
      toast({
        description: "Kwota oferty musi być większa niż 0",
        variant: "destructive",
      });
      return;
    }

    // Validate 60% minimum of reserve price
    if (reservePrice && numericBidAmount < (reservePrice * 0.6)) {
      const minAllowed = Math.ceil(reservePrice * 0.6);
      setBidError(`Minimalna oferta to ${minAllowed.toLocaleString('pl-PL')} PLN (60% ceny minimalnej)`);
      return;
    }
    setBidError(""); // Clear any previous errors

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
      // The place_bid RPC returns messages in English from the database.
      // We translate them here to Polish before showing to dealers.
      const response = data as any;
      if (response?.success) {
      // Toast: Bid Placed Successfully - Bid was successfully placed
      toast({
        description: `Twoja oferta w wysokości ${formatCurrency(numericBidAmount)} została złożona`,
      });
        setBidAmount("");
        await fetchMyBid();
        // The parent component should handle refreshing the data
      } else {
        const errorMessage = response?.message || response?.error || "Failed to place bid";
        throw new Error(translateErrorMessage(errorMessage));
      }
    } catch (error) {
      // Toast: Failed to Place Bid - Error placing bid
      const errorMessage = error instanceof Error ? error.message : "Spróbuj ponownie";
      toast({
        description: translateErrorMessage(errorMessage),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full mb-4">
      <CardHeader>
        <CardTitle className="text-heading-sm font-kanit font-semibold flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Złóż ofertę
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            {myBid !== null && (
              <p className="text-sm text-muted-foreground mb-2">
                Twoja ostatnia oferta:
                <span className="ml-1 inline-flex items-center rounded border border-green-200 bg-green-100 px-2 py-0.5 font-semibold text-green-800">
                  {formatCurrency(myBid)}
                </span>
              </p>
            )}
          {reservePrice && (
            <div className="space-y-2">
              <div className="text-center">
                <p className="text-base text-muted-foreground font-medium">
                  Cena wyjściowa
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {Math.round(reservePrice).toLocaleString('pl-PL')} zł
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                Oferty mogą być składane powyżej lub poniżej tej kwoty. Im bardziej atrakcyjna oferta, tym większa szansa na akceptację.
              </p>
            </div>
          )}
          </div>
          
          <div className="space-y-2">
            <label htmlFor="bidAmount" className="flex items-center gap-1 text-sm font-medium">
              Twoja oferta (PLN)
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label="Informacje o maksymalnej ofercie"
                      className="ml-1 inline-flex items-center text-muted-foreground hover:text-foreground"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent 
                    side="left" 
                    sideOffset={12} 
                    avoidCollisions={true} 
                    collisionPadding={16} 
                    align="center"
                    className="max-w-sm bg-[#393b39] text-body-text"
                  >
                    <div className="text-left leading-relaxed">
                      Ustal maksymalną ofertę, a my będziemy automatycznie licytować w Twoim imieniu, podbijając o 250PLN, aby zapewnić wygraną.
                      <br />
                      Jeśli jesteś jedynym licytującym, Twoja ostateczna oferta zostanie ustalona na poziomie ceny orientacyjnej lub Twojej maksymalnej oferty, jeśli jest ona niższa niż cena orientacyjna.
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
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
              className="h-14 text-lg border-2 border-[#D81B24] focus-visible:ring-[#D81B24]"
            />
            {bidError && (
              <p className="text-sm text-red-600 mt-2 font-medium">{bidError}</p>
            )}
          </div>

          <Button
            onClick={handlePlaceBid}
            disabled={isSubmitting}
            className="w-full h-16 text-xl font-bold bg-[#D81B24] hover:bg-[#B01831]"
          >
            {isSubmitting ? "Składanie oferty..." : "Złóż ofertę"}
          </Button>

          <div className="mt-4 text-sm text-muted-foreground space-y-2">
            <p>Oferty są przekazywane sprzedającemu natychmiastowo.</p>
            <p>Po podjęciu decyzji przez sprzedającego kontaktujemy się z Tobą.</p>
            <p>Konkurencyjna oferta złożona wcześniej ma większą szansę na akceptację, zanim pojawią się kolejne — wyższe — oferty.</p>
            <p>W przypadku akceptacji oferty płatność następuje dopiero przy odbiorze auta, po jego obejrzeniu.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
