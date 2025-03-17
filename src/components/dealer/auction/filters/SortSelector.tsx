
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SortOption, SortSelectorProps } from "../types";

export const sortOptions: SortOption[] = [
  { value: "ending-soon", label: "Ending Soon" },
  { value: "newest", label: "Newest First" },
  { value: "price-low-high", label: "Price: Low to High" },
  { value: "price-high-high", label: "Price: High to Low" },
  { value: "highest-bid", label: "Highest Bid" },
  { value: "year-new-old", label: "Year: New to Old" },
  { value: "year-old-new", label: "Year: Old to New" },
];

export const SortSelector = ({ sortOption, onSortChange }: SortSelectorProps) => {
  return (
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
  );
};
