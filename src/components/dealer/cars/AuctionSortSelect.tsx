
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
        <SelectValue placeholder="Sortuj według..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ending_soon">Kończące się wkrótce</SelectItem>
        <SelectItem value="newest">Najnowsze pierwsze</SelectItem>
        <SelectItem value="oldest">Najstarsze pierwsze</SelectItem>
        <SelectItem value="price-high">Cena: od najwyższej</SelectItem>
        <SelectItem value="price-low">Cena: od najniższej</SelectItem>
        <SelectItem value="mileage-low">Przebieg: od najmniejszego</SelectItem>
        <SelectItem value="mileage-high">Przebieg: od największego</SelectItem>
      </SelectContent>
    </Select>
  );
};
