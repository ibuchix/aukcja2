import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface DealerWelcomeCardProps {
  dealerName: string;
  isLoading: boolean;
}

export const DealerWelcomeCard = ({ dealerName, isLoading }: DealerWelcomeCardProps) => {
  return (
    <Card className="bg-secondary shadow-lg border border-accent/20">
      <CardContent className="pt-6">
        {isLoading ? (
          <Skeleton className="h-6 w-64" />
        ) : (
          <p className="text-lg font-semibold text-body-text">
            Witaj, {dealerName}!
          </p>
        )}
      </CardContent>
    </Card>
  );
};
