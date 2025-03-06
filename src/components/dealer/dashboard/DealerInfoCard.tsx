
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface DealerInfoCardProps {
  dealerProfile: any;
  userEmail: string | undefined;
  isLoading: boolean;
}

export const DealerInfoCard = ({ dealerProfile, userEmail, isLoading }: DealerInfoCardProps) => {
  // Add validation to ensure data consistency
  const isDataConsistent = dealerProfile && userEmail;
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-lg">
          <User className="mr-2 h-5 w-5 text-primary" />
          Dealer Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        ) : isDataConsistent ? (
          <div className="space-y-2">
            <p><span className="font-medium">Name:</span> {dealerProfile?.supervisor_name || "Not available"}</p>
            <p><span className="font-medium">Email:</span> {userEmail || "Not available"}</p>
            <p><span className="font-medium">Verification:</span> {dealerProfile?.is_verified ? "Verified" : "Pending Verification"}</p>
          </div>
        ) : (
          <div className="text-red-500">
            <p>There appears to be an issue with your profile data.</p>
            <p className="text-sm mt-1">Please contact support for assistance.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
