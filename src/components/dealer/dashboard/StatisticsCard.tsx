
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface StatisticsCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  isLoading?: boolean;
}

export const StatisticsCard = ({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  isLoading = false 
}: StatisticsCardProps) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-lg">
          <Icon className="mr-2 h-5 w-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : (
          <>
            <div className="text-3xl font-bold">{value}</div>
            <p className="text-muted-foreground text-sm">{description}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
};
