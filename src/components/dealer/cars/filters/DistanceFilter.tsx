
import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DISTANCE_OPTIONS = [
  { value: "5", label: "Within 5 km" },
  { value: "10", label: "Within 10 km" },
  { value: "25", label: "Within 25 km" },
  { value: "50", label: "Within 50 km" },
  { value: "100", label: "Within 100 km" },
  { value: "250", label: "Within 250 km" },
  { value: "500", label: "Within 500 km" }
];

interface DistanceFilterProps {
  value?: string;
  onChange: (distance: string | undefined) => void;
}

export const DistanceFilter: React.FC<DistanceFilterProps> = ({
  value,
  onChange
}) => {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Distance</Label>
      <Select 
        value={value || "any"} 
        onValueChange={(val) => onChange(val === "any" ? undefined : val)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Any distance" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="any">Any Distance</SelectItem>
          {DISTANCE_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
