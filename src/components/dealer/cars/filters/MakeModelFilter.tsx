
import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Popular car makes - using uppercase to match database values
const CAR_MAKES = [
  "AUDI", "BMW", "CITROEN", "FIAT", "FORD", "HONDA", "HYUNDAI", "KIA", 
  "MAZDA", "MERCEDES-BENZ", "NISSAN", "OPEL", "PEUGEOT", "RENAULT", 
  "SEAT", "SKODA", "TOYOTA", "VOLKSWAGEN", "VOLVO", "OTHER"
];

// Models by make (using uppercase keys to match database)
const CAR_MODELS: Record<string, string[]> = {
  "AUDI": ["A1", "A3", "A4", "A5", "A6", "A7", "A8", "Q3", "Q5", "Q7", "Q8", "TT"],
  "BMW": ["1 Series", "2 Series", "3 Series", "4 Series", "5 Series", "6 Series", "7 Series", "X1", "X3", "X5", "X6", "X7", "Z4"],
  "FORD": ["Fiesta", "Focus", "Mondeo", "Kuga", "EcoSport", "Mustang", "Ranger", "Transit"],
  "MERCEDES-BENZ": ["A-Class", "B-Class", "C-Class", "E-Class", "S-Class", "GLA", "GLC", "GLE", "GLS"],
  "TOYOTA": ["Yaris", "Corolla", "Camry", "Avensis", "RAV4", "Highlander", "Prius", "Land Cruiser"],
  "VOLKSWAGEN": ["Polo", "Golf", "Passat", "Tiguan", "Touareg", "Arteon", "T-Roc"],
  "VOLVO": ["V40", "V60", "V90", "XC40", "XC60", "XC90", "S60", "S90"],
  "CITROEN": ["C1", "C3", "C4", "C5", "Berlingo", "Picasso"],
  "KIA": ["Rio", "Ceed", "Sportage", "Sorento", "Picanto", "Stonic", "Niro"]
};

// Display names for UI (title case)
const MAKE_DISPLAY_NAMES: Record<string, string> = {
  "AUDI": "Audi",
  "BMW": "BMW", 
  "CITROEN": "Citroën",
  "FIAT": "Fiat",
  "FORD": "Ford",
  "HONDA": "Honda",
  "HYUNDAI": "Hyundai",
  "KIA": "Kia",
  "MAZDA": "Mazda",
  "MERCEDES-BENZ": "Mercedes-Benz",
  "NISSAN": "Nissan",
  "OPEL": "Opel",
  "PEUGEOT": "Peugeot",
  "RENAULT": "Renault",
  "SEAT": "Seat",
  "SKODA": "Škoda",
  "TOYOTA": "Toyota",
  "VOLKSWAGEN": "Volkswagen",
  "VOLVO": "Volvo",
  "OTHER": "Other"
};

interface MakeModelFilterProps {
  selectedMake?: string;
  selectedModel?: string;
  onMakeChange: (make: string | undefined) => void;
  onModelChange: (model: string | undefined) => void;
}

export const MakeModelFilter: React.FC<MakeModelFilterProps> = ({
  selectedMake,
  selectedModel,
  onMakeChange,
  onModelChange
}) => {
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [lastSelectedMake, setLastSelectedMake] = useState<string | undefined>(selectedMake);

  const isDev = process.env.NODE_ENV === 'development';
  
  useEffect(() => {
    if (isDev) {
      console.log('MakeModelFilter state:', {
        selectedMake,
        selectedModel,
        lastSelectedMake,
        availableModels: availableModels.length,
        makeIsValid: selectedMake ? CAR_MODELS[selectedMake] : 'no make selected'
      });
    }
  }, [selectedMake, selectedModel, lastSelectedMake, availableModels.length, isDev]);

  // Update available models when make changes
  useEffect(() => {
    if (selectedMake !== lastSelectedMake) {
      if (isDev) {
        console.log('Make changed from', lastSelectedMake, 'to', selectedMake);
        console.log('Available models for make:', selectedMake, CAR_MODELS[selectedMake || ''] || 'none');
      }
      
      // Normalize make to uppercase for lookup
      const normalizedMake = selectedMake?.toUpperCase();
      
      if (normalizedMake && CAR_MODELS[normalizedMake]) {
        setAvailableModels(CAR_MODELS[normalizedMake]);
      } else {
        setAvailableModels([]);
      }
      
      // Clear model selection when make changes (but not on initial load)
      if (lastSelectedMake !== undefined && selectedMake !== lastSelectedMake) {
        if (isDev) {
          console.log('Clearing model selection due to make change');
        }
        onModelChange(undefined);
      }
      
      setLastSelectedMake(selectedMake);
    }
  }, [selectedMake, lastSelectedMake, selectedModel, onModelChange, isDev]);

  const handleMakeChange = (value: string) => {
    if (isDev) {
      console.log('Make selection changed to:', value);
    }
    const newMake = value === "any" ? undefined : value;
    onMakeChange(newMake);
  };

  const handleModelChange = (value: string) => {
    if (isDev) {
      console.log('Model selection changed to:', value);
    }
    const newModel = value === "any" ? undefined : value;
    onModelChange(newModel);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium mb-2 block">Make & Model</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Select 
              value={selectedMake || "any"} 
              onValueChange={handleMakeChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select make" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">All Makes</SelectItem>
                {CAR_MAKES.map((make) => (
                  <SelectItem key={make} value={make}>
                    {MAKE_DISPLAY_NAMES[make] || make}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Select 
              value={selectedModel || "any"} 
              onValueChange={handleModelChange}
              disabled={!selectedMake || availableModels.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">All Models</SelectItem>
                {availableModels.map((model) => (
                  <SelectItem key={model} value={model}>
                    {model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
};
