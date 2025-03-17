
import { useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface AuctionFilters {
  priceMin?: number;
  priceMax?: number;
  make?: string;
  model?: string;
  yearMin?: number;
  yearMax?: number;
  mileageMin?: number;
  mileageMax?: number;
  searchQuery?: string;
}

export interface SortOption {
  value: string;
  label: string;
}

interface DealerAuctionFiltersProps {
  onFiltersChange: (filters: AuctionFilters) => void;
  onSortChange: (sort: string) => void;
  onSearchChange: (search: string) => void;
  sortOption: string;
  searchQuery: string;
}

const sortOptions: SortOption[] = [
  { value: "ending-soon", label: "Ending Soon" },
  { value: "newest", label: "Newest First" },
  { value: "price-low-high", label: "Price: Low to High" },
  { value: "price-high-high", label: "Price: High to Low" },
  { value: "highest-bid", label: "Highest Bid" },
  { value: "year-new-old", label: "Year: New to Old" },
  { value: "year-old-new", label: "Year: Old to New" },
];

export const DealerAuctionFilters = ({
  onFiltersChange,
  onSortChange,
  onSearchChange,
  sortOption,
  searchQuery,
}: DealerAuctionFiltersProps) => {
  const [filters, setFilters] = useState<AuctionFilters>({});
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const handleFilterChange = (key: keyof AuctionFilters, value: string) => {
    const numValue = key !== 'make' && key !== 'model' && key !== 'searchQuery' ? Number(value) || undefined : value;
    const newFilters = { ...filters, [key]: numValue };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  };

  const clearFilters = () => {
    setFilters({});
    onFiltersChange({});
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="Search by make, model or title..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-10"
          />
        </div>
        
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal size={16} />
          {showFilters ? "Hide Filters" : "Show Filters"}
        </Button>
        
        <div className="w-full md:w-[200px]">
          <Select
            value={sortOption}
            onValueChange={onSortChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {showFilters && (
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Price Range (PLN)</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  onChange={(e) => handleFilterChange('priceMin', e.target.value)}
                  value={filters.priceMin || ''}
                />
                <Input
                  type="number"
                  placeholder="Max"
                  onChange={(e) => handleFilterChange('priceMax', e.target.value)}
                  value={filters.priceMax || ''}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Make & Model</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Make"
                  onChange={(e) => handleFilterChange('make', e.target.value)}
                  value={filters.make || ''}
                />
                <Input
                  placeholder="Model"
                  onChange={(e) => handleFilterChange('model', e.target.value)}
                  value={filters.model || ''}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Year Range</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="From"
                  onChange={(e) => handleFilterChange('yearMin', e.target.value)}
                  value={filters.yearMin || ''}
                />
                <Input
                  type="number"
                  placeholder="To"
                  onChange={(e) => handleFilterChange('yearMax', e.target.value)}
                  value={filters.yearMax || ''}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Mileage Range (km)</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  onChange={(e) => handleFilterChange('mileageMin', e.target.value)}
                  value={filters.mileageMin || ''}
                />
                <Input
                  type="number"
                  placeholder="Max"
                  onChange={(e) => handleFilterChange('mileageMax', e.target.value)}
                  value={filters.mileageMax || ''}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
