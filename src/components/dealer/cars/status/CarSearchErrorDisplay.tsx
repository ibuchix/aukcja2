
import React from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CarSearchErrorDisplayProps {
  onRefresh?: () => void;
  errorMessage?: string;
}

export const CarSearchErrorDisplay = ({ 
  onRefresh,
  errorMessage 
}: CarSearchErrorDisplayProps) => {
  return (
    <div className="p-8 text-center border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 rounded-lg">
      <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">
        Error loading car listings
      </h3>
      
      <p className="text-muted-foreground mb-4">
        {errorMessage || "We couldn't retrieve the available cars. Please try again."}
      </p>
      
      {onRefresh && (
        <Button 
          variant="outline" 
          onClick={onRefresh}
          className="mt-2"
        >
          Try Again
        </Button>
      )}
    </div>
  );
};
