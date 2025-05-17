
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { DealerProfileSkeleton } from "./DealerProfileSkeleton";

export function DealerProfileLoading() {
  return (
    <Card className="mb-6 shadow-sm">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Loader2 className="mr-2 h-5 w-5 text-primary animate-spin" />
            <span>Loading dealer profile...</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <DealerProfileSkeleton />
      </CardContent>
    </Card>
  );
}
