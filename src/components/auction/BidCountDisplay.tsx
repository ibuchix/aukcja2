
import { Users, Gavel } from "lucide-react";
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
          <div className="flex items-center gap-2 text-blue-700">
            <Users className="h-4 w-4" />
            <span className="text-sm font-medium">Złóż pierwszą ofertę na ten samochód</span>
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
