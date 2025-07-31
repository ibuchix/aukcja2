
import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const FUEL_TYPE_OPTIONS = [
  { value: "petrol", label: "Benzyna" },
  { value: "diesel", label: "Diesel" },
  { value: "electric", label: "Elektryczny" },
  { value: "hybrid", label: "Hybrydowy" },
  { value: "plug-in-hybrid", label: "Hybrydowy plug-in" },
  { value: "lpg", label: "LPG" },
  { value: "cng", label: "CNG" }
];

interface FuelTypeFilterProps {
  value?: string;
  onChange: (fuelType: string | undefined) => void;
}

export const FuelTypeFilter: React.FC<FuelTypeFilterProps> = ({
  value,
  onChange
}) => {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Rodzaj paliwa</Label>
      <Select 
        value={value || "any"} 
        onValueChange={(val) => onChange(val === "any" ? undefined : val)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Any" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="any">Dowolne paliwo</SelectItem>
          {FUEL_TYPE_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
