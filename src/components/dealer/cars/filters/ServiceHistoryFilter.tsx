
import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SERVICE_HISTORY_OPTIONS = [
  { value: "full", label: "Full Service History" },
  { value: "partial", label: "Partial Service History" },
  { value: "none", label: "No Service History" },
  { value: "unknown", label: "Unknown" }
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
        value={value || ""} 
        onValueChange={(val) => onChange(val || undefined)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Any" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Any Service History</SelectItem>
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
