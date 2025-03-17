
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FilterFieldProps } from "../types";

export const FilterFields = ({ filters, onFilterChange }: FilterFieldProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div className="space-y-2">
        <Label>Price Range (PLN)</Label>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Min"
            onChange={(e) => onFilterChange('priceMin', e.target.value)}
            value={filters.priceMin || ''}
          />
          <Input
            type="number"
            placeholder="Max"
            onChange={(e) => onFilterChange('priceMax', e.target.value)}
            value={filters.priceMax || ''}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Make & Model</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Make"
            onChange={(e) => onFilterChange('make', e.target.value)}
            value={filters.make || ''}
          />
          <Input
            placeholder="Model"
            onChange={(e) => onFilterChange('model', e.target.value)}
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
            onChange={(e) => onFilterChange('yearMin', e.target.value)}
            value={filters.yearMin || ''}
          />
          <Input
            type="number"
            placeholder="To"
            onChange={(e) => onFilterChange('yearMax', e.target.value)}
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
            onChange={(e) => onFilterChange('mileageMin', e.target.value)}
            value={filters.mileageMin || ''}
          />
          <Input
            type="number"
            placeholder="Max"
            onChange={(e) => onFilterChange('mileageMax', e.target.value)}
            value={filters.mileageMax || ''}
          />
        </div>
      </div>
    </div>
  );
};
