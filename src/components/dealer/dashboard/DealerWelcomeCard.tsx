
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface DealerWelcomeCardProps {
  dealerName: string;
  isLoading: boolean;
}

export const DealerWelcomeCard = ({ dealerName, isLoading }: DealerWelcomeCardProps) => {
  const currentHour = new Date().getHours();
  
  let greeting = "Welcome";
  if (currentHour < 12) greeting = "Good morning";
  else if (currentHour < 18) greeting = "Good afternoon";
  else greeting = "Good evening";

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
          <p className="text-subtitle-text">
            Welcome to your dashboard. Here you can manage your auctions, 
            bids, and view important information about your account.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
