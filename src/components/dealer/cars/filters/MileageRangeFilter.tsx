
import React, { useState, useEffect, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";

interface MileageRangeFilterProps {
  minMileage?: number;
  maxMileage?: number;
  onMileageChange: (min: number | undefined, max: number | undefined) => void;
}

const MIN_MILEAGE = 0;
const MAX_MILEAGE = 500000;

export const MileageRangeFilter: React.FC<MileageRangeFilterProps> = ({
  minMileage,
  maxMileage,
  onMileageChange
}) => {
  // Use props as the source of truth, with defaults
  const currentMinMileage = minMileage ?? MIN_MILEAGE;
  const currentMaxMileage = maxMileage ?? MAX_MILEAGE;
  
  const [sliderValues, setSliderValues] = useState([currentMinMileage, currentMaxMileage]);
  const [inputMin, setInputMin] = useState(currentMinMileage.toString());
  const [inputMax, setInputMax] = useState(currentMaxMileage.toString());

  // Update internal state when props change
  useEffect(() => {
    const newMin = minMileage ?? MIN_MILEAGE;
    const newMax = maxMileage ?? MAX_MILEAGE;
    
    setSliderValues([newMin, newMax]);
    setInputMin(newMin.toString());
    setInputMax(newMax.toString());
  }, [minMileage, maxMileage]);

  const handleSliderChange = useCallback((values: number[]) => {
    setSliderValues(values);
    setInputMin(values[0].toString());
    setInputMax(values[1].toString());
    
    // Call parent callback
    onMileageChange(
      values[0] === MIN_MILEAGE ? undefined : values[0],
      values[1] === MAX_MILEAGE ? undefined : values[1]
    );
  }, [onMileageChange]);

  const handleInputChange = useCallback((type: 'min' | 'max', value: string) => {
    const numValue = parseInt(value) || 0;
    
    if (type === 'min') {
      setInputMin(value);
      const newMin = Math.min(numValue, sliderValues[1]);
      const newValues = [newMin, sliderValues[1]];
      setSliderValues(newValues);
      
      onMileageChange(
        newMin === MIN_MILEAGE ? undefined : newMin,
        sliderValues[1] === MAX_MILEAGE ? undefined : sliderValues[1]
      );
    } else {
      setInputMax(value);
      const newMax = Math.max(numValue, sliderValues[0]);
      const newValues = [sliderValues[0], newMax];
      setSliderValues(newValues);
      
      onMileageChange(
        sliderValues[0] === MIN_MILEAGE ? undefined : sliderValues[0],
        newMax === MAX_MILEAGE ? undefined : newMax
      );
    }
  }, [onMileageChange, sliderValues]);

  return (
    <div className="space-y-4">
      <Label className="text-sm font-medium">Zakres przebiegu (km)</Label>
      
      <div className="px-3">
        <Slider
          value={sliderValues}
          onValueChange={handleSliderChange}
          max={MAX_MILEAGE}
          min={MIN_MILEAGE}
          step={5000}
          className="w-full"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-xs text-muted-foreground">Minimalny przebieg</Label>
          <Input
            type="number"
            value={inputMin}
            onChange={(e) => handleInputChange('min', e.target.value)}
            placeholder="0"
            min={MIN_MILEAGE}
            max={MAX_MILEAGE}
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Maksymalny przebieg</Label>
          <Input
            type="number"
            value={inputMax}
            onChange={(e) => handleInputChange('max', e.target.value)}
            placeholder="500000"
            min={MIN_MILEAGE}
            max={MAX_MILEAGE}
          />
        </div>
      </div>
    </div>
  );
};
