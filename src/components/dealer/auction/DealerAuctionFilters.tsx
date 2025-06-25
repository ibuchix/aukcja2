
import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchBar } from "./filters/SearchBar";
import { SortSelector } from "./filters/SortSelector";
import { AdvancedFilterPanel } from "./filters/AdvancedFilterPanel";
import { AuctionFilters, DealerAuctionFiltersProps } from "./types";

export const DealerAuctionFilters = ({
  filters = {},
  onFilterChange,
  onFiltersChange,
  onSortChange,
  onSearchChange,
  sortOption,
  searchQuery,
}: DealerAuctionFiltersProps & {
  filters?: AuctionFilters;
  onFilterChange?: (key: keyof AuctionFilters, value: string | undefined) => void;
}) => {
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const handleFilterChange = (key: keyof AuctionFilters, value: string) => {
    if (onFilterChange) {
      onFilterChange(key, value);
    } else {
      // Fallback for backward compatibility
      const newFilters = { ...filters, [key]: value };
      onFiltersChange(newFilters);
    }
  };

  const clearFilters = () => {
    if (onFilterChange) {
      // Clear individual filters
      Object.keys(filters).forEach(key => {
        onFilterChange(key as keyof AuctionFilters, undefined);
      });
    } else {
      // Fallback for backward compatibility
      onFiltersChange({});
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <SearchBar 
          searchQuery={searchQuery} 
          onSearchChange={onSearchChange} 
        />
        
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal size={16} />
          {showFilters ? "Hide Filters" : "Show Filters"}
        </Button>
        
        <SortSelector 
          sortOption={sortOption} 
          onSortChange={onSortChange} 
        />
      </div>

      <AdvancedFilterPanel 
        showFilters={showFilters}
        filters={filters}
        onFilterChange={handleFilterChange}
        clearFilters={clearFilters}
      />
    </div>
  );
};

// Re-export for backward compatibility
export type { AuctionFilters } from "./types";
