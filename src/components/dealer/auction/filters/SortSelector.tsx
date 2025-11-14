
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SortOption, SortSelectorProps } from "../types";

export const sortOptions: SortOption[] = [
  { value: "ending-soon", label: "Kończące się wkrótce" },
  { value: "newest", label: "Najnowsze pierwsze" },
  { value: "price-low-high", label: "Cena: od najniższej" },
  { value: "price-high-low", label: "Cena: od najwyższej" },
  { value: "highest-bid", label: "Najwyższa oferta" },
  { value: "year-new-old", label: "Rok: od najnowszego" },
  { value: "year-old-new", label: "Rok: od najstarszego" },
];

export const SortSelector = ({ sortOption, onSortChange }: SortSelectorProps) => {
  return (
    <div className="w-full md:w-[200px]">
      <Select
        value={sortOption}
        onValueChange={onSortChange}
      >
        <SelectTrigger>
          <SelectValue placeholder="Sortuj według" />
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
  );
};
