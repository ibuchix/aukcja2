
import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";

interface PriceRangeFilterProps {
  minPrice?: number;
  maxPrice?: number;
  onPriceChange: (min: number | undefined, max: number | undefined) => void;
}

const MIN_PRICE = 0;
const MAX_PRICE = 2000000;

export const PriceRangeFilter: React.FC<PriceRangeFilterProps> = ({
  minPrice = MIN_PRICE,
  maxPrice = MAX_PRICE,
  onPriceChange
}) => {
  const [sliderValues, setSliderValues] = useState([minPrice, maxPrice]);
  const [inputMin, setInputMin] = useState(minPrice.toString());
  const [inputMax, setInputMax] = useState(maxPrice.toString());

  useEffect(() => {
    setSliderValues([minPrice, maxPrice]);
    setInputMin(minPrice.toString());
    setInputMax(maxPrice.toString());
  }, [minPrice, maxPrice]);

  const handleSliderChange = (values: number[]) => {
    setSliderValues(values);
    setInputMin(values[0].toString());
    setInputMax(values[1].toString());
    onPriceChange(
      values[0] === MIN_PRICE ? undefined : values[0],
      values[1] === MAX_PRICE ? undefined : values[1]
    );
  };

  const handleInputChange = (type: 'min' | 'max', value: string) => {
    const numValue = parseInt(value) || 0;
    
    if (type === 'min') {
      setInputMin(value);
      const newMin = Math.min(numValue, sliderValues[1]);
      const newValues = [newMin, sliderValues[1]];
      setSliderValues(newValues);
      onPriceChange(
        newMin === MIN_PRICE ? undefined : newMin,
        sliderValues[1] === MAX_PRICE ? undefined : sliderValues[1]
      );
    } else {
      setInputMax(value);
      const newMax = Math.max(numValue, sliderValues[0]);
      const newValues = [sliderValues[0], newMax];
      setSliderValues(newValues);
      onPriceChange(
        sliderValues[0] === MIN_PRICE ? undefined : sliderValues[0],
        newMax === MAX_PRICE ? undefined : newMax
      );
    }
  };

  return (
    <div className="space-y-4">
      <Label className="text-sm font-medium">Price Range (PLN)</Label>
      
      <div className="px-3">
        <Slider
          value={sliderValues}
          onValueChange={handleSliderChange}
          max={MAX_PRICE}
          min={MIN_PRICE}
          step={10000}
          className="w-full"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-xs text-muted-foreground">Min Price</Label>
          <Input
            type="number"
            value={inputMin}
            onChange={(e) => handleInputChange('min', e.target.value)}
            placeholder="0"
            min={MIN_PRICE}
            max={MAX_PRICE}
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Max Price</Label>
          <Input
            type="number"
            value={inputMax}
            onChange={(e) => handleInputChange('max', e.target.value)}
            placeholder="2000000"
            min={MIN_PRICE}
            max={MAX_PRICE}
          />
        </div>
      </div>
    </div>
  );
};
