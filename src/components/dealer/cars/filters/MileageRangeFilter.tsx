
import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";

interface MileageRangeFilterProps {
  minMileage?: number;
  maxMileage?: number;
  onMileageChange: (min: number | undefined, max: number | undefined) => void;
}

const MIN_MILEAGE = 0;
const MAX_MILEAGE = 300000;

export const MileageRangeFilter: React.FC<MileageRangeFilterProps> = ({
  minMileage = MIN_MILEAGE,
  maxMileage = MAX_MILEAGE,
  onMileageChange
}) => {
  const [sliderValues, setSliderValues] = useState([minMileage, maxMileage]);
  const [inputMin, setInputMin] = useState(minMileage.toString());
  const [inputMax, setInputMax] = useState(maxMileage.toString());

  useEffect(() => {
    setSliderValues([minMileage, maxMileage]);
    setInputMin(minMileage.toString());
    setInputMax(maxMileage.toString());
  }, [minMileage, maxMileage]);

  const handleSliderChange = (values: number[]) => {
    setSliderValues(values);
    setInputMin(values[0].toString());
    setInputMax(values[1].toString());
    onMileageChange(
      values[0] === MIN_MILEAGE ? undefined : values[0],
      values[1] === MAX_MILEAGE ? undefined : values[1]
    );
  };

  const handleInputChange = (type: 'min' | 'max', value: string) => {
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
  };

  return (
    <div className="space-y-4">
      <Label className="text-sm font-medium">Mileage Range (km)</Label>
      
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
          <Label className="text-xs text-muted-foreground">Min Mileage</Label>
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
          <Label className="text-xs text-muted-foreground">Max Mileage</Label>
          <Input
            type="number"
            value={inputMax}
            onChange={(e) => handleInputChange('max', e.target.value)}
            placeholder="300000"
            min={MIN_MILEAGE}
            max={MAX_MILEAGE}
          />
        </div>
      </div>
    </div>
  );
};
