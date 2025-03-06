
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface AdditionalDetailsCardProps {
  dealerProfile: any;
  isLoading: boolean;
}

export const AdditionalDetailsCard = ({ dealerProfile, isLoading }: AdditionalDetailsCardProps) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-lg">
          <FileText className="mr-2 h-5 w-5 text-primary" />
          Additional Details
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : (
          <div className="space-y-2">
            <p><span className="font-medium">Tax ID:</span> {dealerProfile?.tax_id || "Not available"}</p>
            <p><span className="font-medium">Business Registry:</span> {dealerProfile?.business_registry_number || "Not available"}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
