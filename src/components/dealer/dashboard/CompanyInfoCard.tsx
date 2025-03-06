
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Building2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface CompanyInfoCardProps {
  dealerProfile: any;
  isLoading: boolean;
}

export const CompanyInfoCard = ({ dealerProfile, isLoading }: CompanyInfoCardProps) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-lg">
          <Building2 className="mr-2 h-5 w-5 text-primary" />
          Company Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        ) : (
          <div className="space-y-2">
            <p><span className="font-medium">Address:</span> {dealerProfile?.address || "Not available"}</p>
            <p><span className="font-medium">License:</span> {dealerProfile?.license_number || "Not available"}</p>
            <p><span className="font-medium">Tax ID:</span> {dealerProfile?.tax_id || "Not available"}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
