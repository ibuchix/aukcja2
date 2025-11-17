
import { HelpCircle, Gavel } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useBidCount } from "@/hooks/useBidCount";
import { Skeleton } from "@/components/ui/skeleton";

interface BidCountDisplayProps {
  carId: string;
}

export const BidCountDisplay = ({ carId }: BidCountDisplayProps) => {
  const { data: bidCount, isLoading } = useBidCount(carId);

  if (isLoading) {
    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <Skeleton className="h-6 w-40" />
        </CardContent>
      </Card>
    );
  }

  if (!bidCount || bidCount.uniqueBidders === 0) {
    return (
      <Card className="mb-4 bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="text-blue-700">
            <div className="flex items-center gap-2 mb-2">
              <HelpCircle className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm font-semibold">Informacje o licytacji:</span>
            </div>
            <ul className="text-sm space-y-1.5 list-disc list-inside ml-1">
              <li>Oferty są ukryte — widzi je wyłącznie sprzedający.</li>
              <li>Cena orientacyjna = kwota zaakceptowana przez sprzedającego.</li>
              <li>Możesz licytować powyżej lub poniżej ceny orientacyjnej — im bardziej konkurencyjna oferta, tym większa szansa na wygraną.</li>
              <li>Zakup może nastąpić w każdej chwili, gdy sprzedający zaakceptuje ofertę.</li>
              <li>Płacisz dopiero po odbiorze auta, bezpośrednio sprzedającemu.</li>
              <li>Masz okazje sprawdzic auto przed zapłaceniem</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4 bg-green-50 border-green-200">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-green-700">
          <Gavel className="h-4 w-4" />
          <span className="text-sm font-medium">
            Liczba innych ofert: {bidCount.count}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
