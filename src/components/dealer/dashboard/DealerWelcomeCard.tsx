import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface DealerWelcomeCardProps {
  dealerName: string;
  isLoading: boolean;
}

export const DealerWelcomeCard = ({ dealerName, isLoading }: DealerWelcomeCardProps) => {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

  // Mobile collapsible version
  if (isMobile) {
    return (
      <Card className="bg-secondary shadow-lg border border-accent/20">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-2 cursor-pointer hover:bg-accent/10 transition-colors">
              <div className="flex items-center justify-between w-full">
                <CardTitle className="text-lg font-semibold text-body-text text-left">
                  {isLoading ? (
                    <Skeleton className="h-6 w-64" />
                  ) : (
                    "Zasady Aukcji — Najważniejsze Informacje"
                  )}
                </CardTitle>
                <ChevronDown 
                  className={`h-5 w-5 text-body-text flex-shrink-0 transition-transform duration-200 ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent className="pt-0">
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              ) : (
                <div className="text-subtitle-text space-y-3 text-sm">
                  <ul className="space-y-2 list-disc list-inside">
                    <li>Aukcja trwa od niedzieli 20:00 do piątku 15:00 — możesz licytować o dowolnej porze.</li>
                    <li>Cena orientacyjna = kwota zaakceptowana przez sprzedającego.</li>
                    <li>Zakup może nastąpić w każdej chwili, gdy tylko sprzedający zaakceptuje ofertę.</li>
                    <li>Oferty są ukryte — widzi je wyłącznie sprzedający.</li>
                    <li>Po Twojej ofercie natychmiast kontaktujemy sprzedającego w celu finalizacji.</li>
                    <li>Płacisz dopiero po odbiorze auta, bezpośrednio sprzedającemu.</li>
                    <li>Prywatne auta w cenach handlowych — dostępne tylko dla komisów.</li>
                    <li>Wszystkie auta są zarejestrowane w Polsce.</li>
                  </ul>
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
          </CollapsibleContent>
        </Collapsible>
      </Card>
    );
  }

  // Desktop version (unchanged)
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
            <ul className="space-y-2 list-disc list-inside">
              <li>Aukcja trwa od niedzieli 20:00 do piątku 15:00 — możesz licytować o dowolnej porze.</li>
              <li>Cena orientacyjna = kwota zaakceptowana przez sprzedającego.</li>
              <li>Zakup może nastąpić w każdej chwili, gdy tylko sprzedający zaakceptuje ofertę.</li>
              <li>Oferty są ukryte — widzi je wyłącznie sprzedający.</li>
              <li>Po Twojej ofercie natychmiast kontaktujemy sprzedającego w celu finalizacji.</li>
              <li>Płacisz dopiero po odbiorze auta, bezpośrednio sprzedającemu.</li>
              <li>Prywatne auta w cenach handlowych — dostępne tylko dla komisów.</li>
              <li>Wszystkie auta są zarejestrowane w Polsce.</li>
            </ul>
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
