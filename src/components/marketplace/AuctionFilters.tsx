
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export interface AuctionFilters {
  priceMin?: number;
  priceMax?: number;
  make?: string;
  model?: string;
  yearMin?: number;
  yearMax?: number;
  mileageMin?: number;
  mileageMax?: number;
  maxDistance?: number;
}

interface AuctionFiltersProps {
  onFiltersChange: (filters: AuctionFilters) => void;
}

const AuctionFilters = ({ onFiltersChange }: AuctionFiltersProps) => {
  const [filters, setFilters] = useState<AuctionFilters>({});

  const handleFilterChange = (key: keyof AuctionFilters, value: string) => {
    const numValue = key !== 'make' && key !== 'model' ? Number(value) || undefined : value;
    const newFilters = { ...filters, [key]: numValue };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  return (
    <div className="space-y-4 p-4 bg-accent/50 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Filters</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Price Range (PLN)</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Min"
              onChange={(e) => handleFilterChange('priceMin', e.target.value)}
            />
            <Input
              type="number"
              placeholder="Max"
              onChange={(e) => handleFilterChange('priceMax', e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Make & Model</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Make"
              onChange={(e) => handleFilterChange('make', e.target.value)}
            />
            <Input
              placeholder="Model"
              onChange={(e) => handleFilterChange('model', e.target.value)}
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
            />
            <Input
              type="number"
              placeholder="To"
              onChange={(e) => handleFilterChange('yearMax', e.target.value)}
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
            />
            <Input
              type="number"
              placeholder="Max"
              onChange={(e) => handleFilterChange('mileageMax', e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Max Distance (km)</Label>
          <Input
            type="number"
            placeholder="Maximum distance"
            onChange={(e) => handleFilterChange('maxDistance', e.target.value)}
          />
        </div>
      </div>

      <Button
        variant="secondary"
        onClick={() => {
          setFilters({});
          onFiltersChange({});
        }}
      >
        Clear Filters
      </Button>
    </div>
  );
};

export default AuctionFilters;
