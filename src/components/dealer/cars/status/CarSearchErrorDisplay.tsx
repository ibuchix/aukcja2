
import React from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface CarSearchErrorDisplayProps {
  onRefresh?: () => void;
  errorMessage?: string;
}

export const CarSearchErrorDisplay = ({ 
  onRefresh,
  errorMessage 
}: CarSearchErrorDisplayProps) => {
  return (
    <Card className="border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-lg font-semibold text-red-700 dark:text-red-400">
          <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
          Error loading car listings
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-muted-foreground text-sm">
          {errorMessage || "We couldn't retrieve the available cars. Please try again."}
        </p>
        
        <div className="mt-4 text-sm space-y-1 text-gray-600">
          <p>This might be caused by:</p>
          <ul className="list-disc list-inside pl-2 space-y-1">
            <li>A temporary connection issue</li>
            <li>The server might be temporarily unavailable</li>
            <li>Your profile may need additional verification</li>
          </ul>
        </div>
      </CardContent>
      
      {onRefresh && (
        <CardFooter>
          <Button 
            variant="outline" 
            onClick={onRefresh}
            className="flex items-center gap-2"
          >
            <RefreshCcw className="h-4 w-4" />
            Try Again
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};
