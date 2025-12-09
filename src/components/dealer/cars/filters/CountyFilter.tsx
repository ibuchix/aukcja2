import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { POLISH_COUNTIES } from "@/constants/polishCounties";

interface CountyFilterProps {
  selectedCounty?: string;
  onCountyChange: (county: string | undefined) => void;
}

export const CountyFilter: React.FC<CountyFilterProps> = ({
  selectedCounty,
  onCountyChange
}) => {
  const handleCountyChange = (value: string) => {
    onCountyChange(value === "any" ? undefined : value);
  };

  return (
    <div>
      <Label className="text-sm font-medium mb-2 block">Województwo</Label>
      <Select 
        value={selectedCounty || "any"} 
        onValueChange={handleCountyChange}
      >
        <SelectTrigger>
          <SelectValue placeholder="Wybierz województwo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="any">Wszystkie województwa</SelectItem>
          {POLISH_COUNTIES.map((county) => (
            <SelectItem key={county} value={county}>
              {county}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
