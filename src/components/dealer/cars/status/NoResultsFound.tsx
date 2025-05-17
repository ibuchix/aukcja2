
import React from "react";
import { Car, Search, Filter, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface NoResultsFoundProps {
  searchQuery?: string;
  onClearFilters: () => void;
}

export const NoResultsFound = ({ searchQuery, onClearFilters }: NoResultsFoundProps) => {
  return (
    <Card className="bg-muted/20 shadow-sm">
      <CardHeader className="pb-2 text-center">
        <div className="mx-auto">
          <Car className="h-16 w-16 text-muted-foreground mx-auto" />
        </div>
        <CardTitle className="text-xl mt-2">No matching vehicles found</CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        {searchQuery ? (
          <p className="text-muted-foreground mb-4">
            No vehicles match your search for "<strong>{searchQuery}</strong>"
          </p>
        ) : (
          <p className="text-muted-foreground mb-4">
            No vehicles match your current filter criteria
          </p>
        )}
        
        <div className="space-y-4 text-sm max-w-md mx-auto">
          <p>Try adjusting your search or filters to find more vehicles:</p>
          <ul className="text-muted-foreground list-disc list-inside space-y-1 text-left pl-4">
            <li>Check if the make or model name is spelled correctly</li>
            <li>Try broadening your year range</li>
            <li>Remove some filters to see more results</li>
            <li>The database might be empty if this is a new account</li>
          </ul>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-center gap-4">
        <Button 
          variant="outline"
          onClick={onClearFilters}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Clear all filters
        </Button>
        
        <Button 
          variant="default"
          onClick={() => window.location.reload()}
          className="flex items-center gap-2"
        >
          <RefreshCcw className="h-4 w-4" />
          Refresh page
        </Button>
      </CardFooter>
    </Card>
  );
};
