
import { Button } from "@/components/ui/button";
import { FilterFields } from "./FilterFields";
import { AuctionFilters } from "./types";

interface AdvancedFilterPanelProps {
  showFilters: boolean;
  filters: AuctionFilters;
  onFilterChange: (key: keyof AuctionFilters, value: string) => void;
  clearFilters: () => void;
}

export const AdvancedFilterPanel = ({ 
  showFilters, 
  filters, 
  onFilterChange, 
  clearFilters 
}: AdvancedFilterPanelProps) => {
  if (!showFilters) return null;
  
  return (
    <div className="p-4 bg-accent/50 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Filters</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
        >
          Clear Filters
        </Button>
      </div>
      
      <FilterFields filters={filters} onFilterChange={onFilterChange} />
    </div>
  );
};
