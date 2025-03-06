
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface DealerWelcomeCardProps {
  dealerName: string;
  isLoading: boolean;
}

export const DealerWelcomeCard = ({ dealerName, isLoading }: DealerWelcomeCardProps) => {
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Welcome, {isLoading ? <Skeleton className="h-6 w-32" /> : dealerName || "Dealer"}</CardTitle>
        <CardDescription>
          This is your personal dashboard where you can manage your dealer activities
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>
          You can browse and bid on vehicles, manage your profile, and track your auctions from here.
        </p>
      </CardContent>
    </Card>
  );
};
