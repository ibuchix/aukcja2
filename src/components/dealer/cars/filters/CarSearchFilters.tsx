import React, { useState } from "react";
import { FilterBar, FilterSearch } from "../../ui/FilterBar";
import { Button } from "@/components/ui/button";
import { Car } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { AuctionFilters } from "../../auction/types";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Popular car makes with their display names
const POPULAR_MAKES = [
  { id: "toyota", name: "Toyota" },
  { id: "volkswagen", name: "Volkswagen" },
  { id: "bmw", name: "BMW" },
  { id: "mercedes", name: "Mercedes" },
  { id: "audi", name: "Audi" },
  { id: "ford", name: "Ford" },
  { id: "peugeot", name: "Peugeot" },
  { id: "renault", name: "Renault" },
  { id: "tesla", name: "Tesla" },
  { id: "nissan", name: "Nissan" }
];

// Common models grouped by make
const POPULAR_MODELS: Record<string, { id: string; name: string }[]> = {
  toyota: [
    { id: "avensis", name: "Avensis" },
    { id: "corolla", name: "Corolla" },
    { id: "camry", name: "Camry" },
    { id: "rav4", name: "RAV4" },
    { id: "yaris", name: "Yaris" }
  ],
  volkswagen: [
    { id: "golf", name: "Golf" },
    { id: "passat", name: "Passat" },
    { id: "polo", name: "Polo" },
    { id: "tiguan", name: "Tiguan" },
    { id: "touareg", name: "Touareg" }
  ],
  bmw: [
    { id: "3", name: "3 Series" },
    { id: "5", name: "5 Series" },
    { id: "7", name: "7 Series" },
    { id: "x3", name: "X3" },
    { id: "x5", name: "X5" }
  ],
  mercedes: [
    { id: "c", name: "C Class" },
    { id: "e", name: "E Class" },
    { id: "s", name: "S Class" },
    { id: "glc", name: "GLC" },
    { id: "a", name: "A Class" }
  ],
  audi: [
    { id: "a3", name: "A3" },
    { id: "a4", name: "A4" },
    { id: "a6", name: "A6" },
    { id: "q3", name: "Q3" },
    { id: "q5", name: "Q5" }
  ],
  ford: [
    { id: "focus", name: "Focus" },
    { id: "fiesta", name: "Fiesta" },
    { id: "mondeo", name: "Mondeo" },
    { id: "kuga", name: "Kuga" },
    { id: "puma", name: "Puma" }
  ],
  nissan: [
    { id: "qashqai", name: "Qashqai" },
    { id: "juke", name: "Juke" },
    { id: "micra", name: "Micra" },
    { id: "x-trail", name: "X-Trail" },
    { id: "leaf", name: "Leaf" }
  ],
  // Add models for other makes as needed
};

const YEAR_RANGES = [
  { id: "last-3", name: "Last 3 years", min: new Date().getFullYear() - 3, max: new Date().getFullYear() },
  { id: "last-5", name: "Last 5 years", min: new Date().getFullYear() - 5, max: new Date().getFullYear() },
  { id: "last-10", name: "Last 10 years", min: new Date().getFullYear() - 10, max: new Date().getFullYear() },
  { id: "2010s", name: "2010-2019", min: 2010, max: 2019 },
  { id: "2000s", name: "2000-2009", min: 2000, max: 2009 }
];

interface CarSearchFiltersProps {
  onFiltersChange: (filters: AuctionFilters) => void;
  onSearchChange: (search: string) => void;
  onSortChange: (sort: string) => void;
  sortOption: string;
  searchQuery: string;
}

export const CarSearchFilters: React.FC<CarSearchFiltersProps> = ({
  onFiltersChange,
  onSearchChange,
  onSortChange,
  sortOption,
  searchQuery
}) => {
  const [filters, setFilters] = useState<AuctionFilters>({});
  const [selectedMake, setSelectedMake] = useState<string | null>(null);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [yearRange, setYearRange] = useState<[number, number] | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number] | null>(null);

  const handleMakeClick = (makeId: string) => {
    if (selectedMake === makeId) {
      // If already selected, deselect it
      setSelectedMake(null);
      setSelectedModels([]);
      
      const { make, ...restFilters } = filters;
      setFilters(restFilters);
      onFiltersChange(restFilters);
    } else {
      // Select it and update filters
      setSelectedMake(makeId);
      setSelectedModels([]);
      
      const updatedFilters = { ...filters, make: POPULAR_MAKES.find(m => m.id === makeId)?.name || makeId };
      setFilters(updatedFilters);
      onFiltersChange(updatedFilters);
    }
  };

  const handleModelClick = (modelId: string) => {
    let newSelectedModels: string[];
    
    if (selectedModels.includes(modelId)) {
      // Remove model if already selected
      newSelectedModels = selectedModels.filter(id => id !== modelId);
    } else {
      // Add model to selection
      newSelectedModels = [...selectedModels, modelId];
    }
    
    setSelectedModels(newSelectedModels);
    
    if (newSelectedModels.length > 0 && selectedMake) {
      // Get display names of selected models
      const modelNames = newSelectedModels.map(id => 
        POPULAR_MODELS[selectedMake]?.find(m => m.id === id)?.name || id
      ).join(', ');
      
      const updatedFilters = { ...filters, model: modelNames };
      setFilters(updatedFilters);
      onFiltersChange(updatedFilters);
    } else {
      // Remove model filter if none selected
      const { model, ...restFilters } = filters;
      setFilters(restFilters);
      onFiltersChange(restFilters);
    }
  };

  const handleYearRangeClick = (min: number, max: number) => {
    if (yearRange && yearRange[0] === min && yearRange[1] === max) {
      // If already selected, deselect it
      setYearRange(null);
      
      const { yearMin, yearMax, ...restFilters } = filters;
      setFilters(restFilters);
      onFiltersChange(restFilters);
    } else {
      // Select it and update filters
      setYearRange([min, max]);
      
      const updatedFilters = { ...filters, yearMin: min, yearMax: max };
      setFilters(updatedFilters);
      onFiltersChange(updatedFilters);
    }
  };

  const handleClearFilters = () => {
    setFilters({});
    setSelectedMake(null);
    setSelectedModels([]);
    setYearRange(null);
    setPriceRange(null);
    onFiltersChange({});
  };

  const handleSortChange = (value: string) => {
    onSortChange(value);
  };

  return (
    <div className="space-y-4">
      <FilterBar
        showClear={Object.keys(filters).length > 0}
        onClear={handleClearFilters}
        searchComponent={
          <FilterSearch
            value={searchQuery}
            onChange={onSearchChange}
            placeholder="Search by make, model or title..."
          />
        }
      >
        <Select value={sortOption} onValueChange={handleSortChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
            <SelectItem value="price-high">Price: High to Low</SelectItem>
            <SelectItem value="price-low">Price: Low to High</SelectItem>
          </SelectContent>
        </Select>
      </FilterBar>

      {/* Always show filters - removed toggle */}
      <div className="bg-muted/30 rounded-lg p-4 space-y-6">
        {/* Popular Makes Section */}
        <div>
          <h3 className="font-medium mb-3 flex items-center">
            <Car className="w-4 h-4 mr-2" /> Popular Makes
          </h3>
          <div className="flex flex-wrap gap-2">
            {POPULAR_MAKES.map(make => (
              <Badge
                key={make.id}
                variant={selectedMake === make.id ? "default" : "outline"}
                className="cursor-pointer hover:bg-muted/80"
                onClick={() => handleMakeClick(make.id)}
              >
                {make.name}
              </Badge>
            ))}
          </div>
        </div>

        {/* Popular Models Section (only show if a make is selected) */}
        {selectedMake && POPULAR_MODELS[selectedMake] && (
          <div>
            <h3 className="font-medium mb-3">Popular {POPULAR_MAKES.find(m => m.id === selectedMake)?.name} Models</h3>
            <div className="flex flex-wrap gap-2">
              {POPULAR_MODELS[selectedMake].map(model => (
                <Badge
                  key={model.id}
                  variant={selectedModels.includes(model.id) ? "default" : "outline"}
                  className="cursor-pointer hover:bg-muted/80"
                  onClick={() => handleModelClick(model.id)}
                >
                  {model.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Year Range Section */}
        <div>
          <h3 className="font-medium mb-3">Year Range</h3>
          <div className="flex flex-wrap gap-2">
            {YEAR_RANGES.map(range => (
              <Badge
                key={range.id}
                variant={yearRange && yearRange[0] === range.min && yearRange[1] === range.max ? "default" : "outline"}
                className="cursor-pointer hover:bg-muted/80"
                onClick={() => handleYearRangeClick(range.min, range.max)}
              >
                {range.name}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
