import React, { useState, useEffect, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";

interface AgeRangeFilterProps {
  minAge?: number;
  maxAge?: number;
  onAgeChange: (min: number | undefined, max: number | undefined) => void;
}

const MIN_AGE = 0;
const MAX_AGE = 30;

export const AgeRangeFilter: React.FC<AgeRangeFilterProps> = ({
  minAge,
  maxAge,
  onAgeChange
}) => {
  // Use props as the source of truth, with defaults
  const currentMinAge = minAge ?? MIN_AGE;
  const currentMaxAge = maxAge ?? MAX_AGE;
  
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
            min === MIN_AGE ? undefined : min,
            max === MAX_AGE ? undefined : max
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
    if (!isNaN(numValue) && numValue >= MIN_AGE && numValue <= sliderValues[1]) {
      const newValues = [numValue, sliderValues[1]];
      setSliderValues(newValues);
      debouncedOnAgeChange(newValues[0], newValues[1]);
    }
  };

  const handleMaxInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMaxInput(value);
    
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= sliderValues[0] && numValue <= MAX_AGE) {
      const newValues = [sliderValues[0], numValue];
      setSliderValues(newValues);
      debouncedOnAgeChange(newValues[0], newValues[1]);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium text-foreground">
          Wiek pojazdu (lata)
        </Label>
        <div className="mt-2">
          <Slider
            value={sliderValues}
            onValueChange={handleSliderChange}
            min={MIN_AGE}
            max={MAX_AGE}
            step={1}
            className="w-full"
          />
        </div>
      </div>
      
      <div className="flex gap-2">
        <div className="flex-1">
          <Label htmlFor="min-age" className="text-xs text-muted-foreground">
            Min. wiek
          </Label>
          <Input
            id="min-age"
            type="number"
            value={minInput}
            onChange={handleMinInputChange}
            min={MIN_AGE}
            max={MAX_AGE}
            className="h-8 text-xs"
            placeholder="0"
          />
        </div>
        <div className="flex-1">
          <Label htmlFor="max-age" className="text-xs text-muted-foreground">
            Maks. wiek
          </Label>
          <Input
            id="max-age"
            type="number"
            value={maxInput}
            onChange={handleMaxInputChange}
            min={MIN_AGE}
            max={MAX_AGE}
            className="h-8 text-xs"
            placeholder="30"
          />
        </div>
      </div>
    </div>
  );
};