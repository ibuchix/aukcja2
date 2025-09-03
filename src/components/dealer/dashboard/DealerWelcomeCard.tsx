
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface DealerWelcomeCardProps {
  dealerName: string;
  isLoading: boolean;
}

export const DealerWelcomeCard = ({ dealerName, isLoading }: DealerWelcomeCardProps) => {
  const currentHour = new Date().getHours();
  
  let greeting = "Witamy";
  if (currentHour < 12) greeting = "Dzień dobry";
  else if (currentHour < 18) greeting = "Dzień dobry";
  else greeting = "Dobry wieczór";

  return (
    <Card className="bg-secondary shadow-lg border border-accent/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-semibold text-body-text">
          {isLoading ? (
            <Skeleton className="h-7 w-48" />
          ) : (
            <>
              {greeting}, {dealerName}!
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-subtitle-text">
              Witamy w panelu dealera 👋. Tutaj możesz przeglądać samochody dostępne w naszych codziennych aukcjach, a także zarządzać swoimi ofertami, zakupami i danymi konta.
            </p>
            <p className="text-subtitle-text">
              Aukcja Autaro.pl zostanie uruchomiona już wkrótce. Po przesłaniu dokumentów Twoje konto będzie kompletne, jednak pełny dostęp do konta i aukcji uzyskasz dopiero w momencie jej startu. Wtedy aktywuje się także Twoje 50% zniżki na pierwsze dwie prowizje.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
