
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SearchBarProps } from "../types";

export const SearchBar = ({ searchQuery, onSearchChange }: SearchBarProps) => {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  };

  return (
    <div className="relative flex-grow">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
      <Input
        placeholder="Search by make, model or title..."
        value={searchQuery}
        onChange={handleSearchChange}
        className="pl-10"
      />
    </div>
  );
};
