
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface DealerWelcomeCardProps {
  dealerName?: string;
  dealershipName?: string;
  isLoading: boolean;
}

export const DealerWelcomeCard = ({ 
  dealerName, 
  dealershipName,
  isLoading 
}: DealerWelcomeCardProps) => {
  return (
    <Card className="bg-gradient-to-r from-blue-500 to-indigo-600 mb-6">
      <CardContent className="pt-6 text-white">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-6 w-3/4 bg-white/20" />
            <Skeleton className="h-4 w-1/2 bg-white/20" />
          </div>
        ) : (
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">
              Welcome, {dealerName || "Dealer"}
            </h2>
            <p className="opacity-90">
              {dealershipName 
                ? `Dashboard for ${dealershipName}` 
                : "Your dealer dashboard - manage your inventory and track auctions"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
