
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AuctionSortSelectProps {
  value: string;
  onValueChange: (value: string) => void;
}

export const AuctionSortSelect: React.FC<AuctionSortSelectProps> = ({ value, onValueChange }) => {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Sort by..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ending_soon">Ending Soon</SelectItem>
        <SelectItem value="newest">Newest First</SelectItem>
        <SelectItem value="oldest">Oldest First</SelectItem>
        <SelectItem value="price-high">Price: High to Low</SelectItem>
        <SelectItem value="price-low">Price: Low to High</SelectItem>
        <SelectItem value="mileage-low">Mileage: Low to High</SelectItem>
        <SelectItem value="mileage-high">Mileage: High to Low</SelectItem>
      </SelectContent>
    </Select>
  );
};
