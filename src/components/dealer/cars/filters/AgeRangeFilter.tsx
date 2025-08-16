import React, { useState, useEffect, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";

interface AgeRangeFilterProps {
  minAge?: number;
  maxAge?: number;
  onAgeChange: (min: number | undefined, max: number | undefined) => void;
}

const MIN_YEAR = 2000;
const MAX_YEAR = new Date().getFullYear();

export const AgeRangeFilter: React.FC<AgeRangeFilterProps> = ({
  minAge,
  maxAge,
  onAgeChange
}) => {
  // Use props as the source of truth, with defaults
  const currentMinAge = minAge ?? MIN_YEAR;
  const currentMaxAge = maxAge ?? MAX_YEAR;
  
  const [sliderValues, setSliderValues] = useState([currentMinAge, currentMaxAge]);
  const [minInput, setMinInput] = useState(currentMinAge.toString());
  const [maxInput, setMaxInput] = useState(currentMaxAge.toString());

  // Update local state when props change
  useEffect(() => {
    setSliderValues([currentMinAge, currentMaxAge]);
    setMinInput(currentMinAge.toString());
    setMaxInput(currentMaxAge.toString());
  }, [currentMinAge, currentMaxAge]);

  // Debounced callback to avoid too many updates
  const debouncedOnAgeChange = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (min: number, max: number) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          onAgeChange(
            min === MIN_YEAR ? undefined : min,
            max === MAX_YEAR ? undefined : max
          );
        }, 300);
      };
    })(),
    [onAgeChange]
  );

  const handleSliderChange = (values: number[]) => {
    const [min, max] = values;
    setSliderValues([min, max]);
    setMinInput(min.toString());
    setMaxInput(max.toString());
    debouncedOnAgeChange(min, max);
  };

  const handleMinInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMinInput(value);
    
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= MIN_YEAR && numValue <= sliderValues[1]) {
      const newValues = [numValue, sliderValues[1]];
      setSliderValues(newValues);
      debouncedOnAgeChange(newValues[0], newValues[1]);
    }
  };

  const handleMaxInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMaxInput(value);
    
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= sliderValues[0] && numValue <= MAX_YEAR) {
      const newValues = [sliderValues[0], numValue];
      setSliderValues(newValues);
      debouncedOnAgeChange(newValues[0], newValues[1]);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium text-foreground">
          Rok produkcji
        </Label>
        <div className="mt-2">
          <Slider
            value={sliderValues}
            onValueChange={handleSliderChange}
            min={MIN_YEAR}
            max={MAX_YEAR}
            step={1}
            className="w-full"
          />
        </div>
      </div>
      
      <div className="flex gap-2">
        <div className="flex-1">
          <Label htmlFor="min-year" className="text-xs text-muted-foreground">
            Min. rok
          </Label>
          <Input
            id="min-year"
            type="number"
            value={minInput}
            onChange={handleMinInputChange}
            min={MIN_YEAR}
            max={MAX_YEAR}
            className="h-8 text-xs"
            placeholder="2000"
          />
        </div>
        <div className="flex-1">
          <Label htmlFor="max-year" className="text-xs text-muted-foreground">
            Maks. rok
          </Label>
          <Input
            id="max-year"
            type="number"
            value={maxInput}
            onChange={handleMaxInputChange}
            min={MIN_YEAR}
            max={MAX_YEAR}
            className="h-8 text-xs"
            placeholder={MAX_YEAR.toString()}
          />
        </div>
      </div>
    </div>
  );
};