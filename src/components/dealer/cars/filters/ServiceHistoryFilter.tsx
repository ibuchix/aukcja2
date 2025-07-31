
import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SERVICE_HISTORY_OPTIONS = [
  { value: "full", label: "Pełna historia serwisowa" },
  { value: "partial", label: "Częściowa historia serwisowa" },
  { value: "none", label: "Brak historii serwisowej" },
  { value: "unknown", label: "Nieznana" }
];

interface ServiceHistoryFilterProps {
  value?: string;
  onChange: (serviceHistory: string | undefined) => void;
}

export const ServiceHistoryFilter: React.FC<ServiceHistoryFilterProps> = ({
  value,
  onChange
}) => {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Service History</Label>
      <Select 
        value={value || "any"} 
        onValueChange={(val) => onChange(val === "any" ? undefined : val)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Any" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="any">Dowolna historia serwisowa</SelectItem>
          {SERVICE_HISTORY_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
