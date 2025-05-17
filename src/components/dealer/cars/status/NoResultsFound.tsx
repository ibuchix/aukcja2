
import React from "react";
import { Car } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NoResultsFoundProps {
  searchQuery?: string;
  onClearFilters: () => void;
}

export const NoResultsFound = ({ searchQuery, onClearFilters }: NoResultsFoundProps) => {
  return (
    <div className="flex flex-col items-center justify-center p-10 bg-muted/20 rounded-lg">
      <Car className="h-16 w-16 text-muted-foreground mb-4" />
      <h3 className="text-xl font-semibold mb-2">No matching vehicles found</h3>
      
      {searchQuery ? (
        <p className="text-muted-foreground text-center mb-4">
          No vehicles match your search for "<strong>{searchQuery}</strong>"
        </p>
      ) : (
        <p className="text-muted-foreground text-center mb-4">
          No vehicles match your current filter criteria
        </p>
      )}
      
      <div className="space-y-4 text-sm text-center max-w-md">
        <p>Try adjusting your filters or search with different criteria</p>
        <ul className="text-muted-foreground list-disc list-inside space-y-1 text-left">
          <li>Check if the make or model name is spelled correctly</li>
          <li>Try broadening your year range</li>
          <li>Remove some filters to see more results</li>
        </ul>
      </div>
      
      <Button 
        variant="outline"
        className="mt-6"
        onClick={onClearFilters}
      >
        Clear all filters
      </Button>
    </div>
  );
};
