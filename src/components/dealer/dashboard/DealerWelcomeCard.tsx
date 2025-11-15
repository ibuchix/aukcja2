
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface DealerWelcomeCardProps {
  dealerName: string;
  isLoading: boolean;
}

export const DealerWelcomeCard = ({ dealerName, isLoading }: DealerWelcomeCardProps) => {
  return (
    <Card className="bg-secondary shadow-lg border border-accent/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-semibold text-body-text">
          {isLoading ? (
            <Skeleton className="h-7 w-64" />
          ) : (
            "Zasady Aukcji — Najważniejsze Informacje"
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        ) : (
          <div className="text-subtitle-text space-y-3">
            <p>Możesz licytować o dowolnej porze — nie ma przewagi czekania do końca, najwyższa oferta wygrywa.</p>
            <ul className="space-y-2 list-disc list-inside">
              <li>Oferty są całkowicie ukryte — inni dealerzy ich nie widzą.</li>
              <li>Cena orientacyjna to kwota zaakceptowana przez sprzedającego — oferty blisko niej wygrywają najczęściej.</li>
              <li>Płacisz dopiero po odbiorze auta, bezpośrednio prywatnemu sprzedającemu.</li>
              <li>Prywatne auta w handlowych cenach — dostępne tylko dla dealerów w ogólnopolskiej aukcji.</li>
              <li>Wszystkie samochody na aukcji są zarejestrowane w Polsce.</li>
              <li>Złóż swoją najlepszą ofertę — jest ukryta, a najwyższa cena wygrywa auto.</li>
            </ul>
            <p>Dzisiejsza aukcja kończy się o 14:00, a kolejna zostanie uruchomiona natychmiast po jej zakończeniu.</p>
            <p>
              Więcej informacji o naszej aukcji znajdziesz na stronie{' '}
              <a 
                href="/how-it-works" 
                className="font-semibold hover:underline underline-offset-2 transition-all"
                style={{ color: '#D81B24' }}
              >
                Jak to działa
              </a>
              {' '}lub zadzwoń do nas pod numer{' '}
              <a 
                href="tel:+48459567877"
                className="font-semibold hover:underline underline-offset-2 transition-all"
                style={{ color: '#32CD32' }}
              >
                +48 459 567 877
              </a>.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
