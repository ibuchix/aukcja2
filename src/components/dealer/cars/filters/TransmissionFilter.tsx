
import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TRANSMISSION_OPTIONS = [
  { value: "manual", label: "Manual" },
  { value: "automatic", label: "Automatic" },
  { value: "cvt", label: "CVT" },
  { value: "semi-automatic", label: "Semi-Automatic" },
  { value: "dual-clutch", label: "Dual Clutch" }
];

interface TransmissionFilterProps {
  value?: string;
  onChange: (transmission: string | undefined) => void;
}

export const TransmissionFilter: React.FC<TransmissionFilterProps> = ({
  value,
  onChange
}) => {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Transmission</Label>
      <Select 
        value={value || "any"} 
        onValueChange={(val) => onChange(val === "any" ? undefined : val)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Any" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="any">Any Transmission</SelectItem>
          {TRANSMISSION_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
