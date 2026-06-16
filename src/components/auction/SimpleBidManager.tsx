
import React from 'react';
import { DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDealerSubscription } from "@/hooks/useDealerSubscription";
import { SubscribeToBidButton } from "@/components/dealer/SubscribeToBidButton";

interface SimpleBidManagerProps {
  carId: string;
  dealerId: string;
  currentHighestBid: number;
  minimumIncrement?: number;
  reservePrice?: number;
  isVerified?: boolean;
}

export const SimpleBidManager = ({
  reservePrice,
  isVerified = true,
}: SimpleBidManagerProps) => {
  const { isActive: isSubscribed, isLoading: subLoading } = useDealerSubscription();

  // Early return if dealer is not verified
  if (!isVerified) {
    return (
      <Card className="w-full mb-4">
        <CardHeader>
          <CardTitle className="text-heading-sm font-kanit font-semibold flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Wymagana weryfikacja
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-amber-800">
              Dostęp do danych sprzedającego mają wyłącznie zweryfikowani dealerzy. Zweryfikuj konto, aby kontynuować.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full mb-4">
      <CardHeader>
        <CardTitle className="text-heading-sm font-kanit font-semibold flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Dostęp do oferty
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
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
              </div>
            )}
          </div>

          {subLoading ? (
            <Button disabled className="w-full h-16 text-xl font-bold bg-muted text-muted-foreground">
              Ładowanie...
            </Button>
          ) : !isSubscribed ? (
            <SubscribeToBidButton />
          ) : (
            <div className="w-full p-4 bg-green-50 border border-green-200 rounded-lg text-center">
              <p className="text-green-800 font-medium">Subskrypcja aktywna</p>
              <p className="text-sm text-green-700 mt-1">
                Masz dostęp do pełnych danych pojazdu i danych sprzedającego.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
