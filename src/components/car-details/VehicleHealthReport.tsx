import { Check, X, Minus, ClipboardList } from "lucide-react";
import { CarListing } from "@/types/cars";
import { cn } from "@/lib/utils";

interface VehicleHealthReportProps {
  car: CarListing;
}

interface ConditionItem {
  label: string;
  value: boolean | null | undefined;
  isPositiveWhenTrue: boolean; // true means "good when value is true" (e.g., AC working)
}

const ConditionIndicator = ({ 
  value, 
  isPositiveWhenTrue 
}: { 
  value: boolean | null | undefined; 
  isPositiveWhenTrue: boolean;
}) => {
  if (value === null || value === undefined) {
    return (
      <div className="flex items-center gap-2">
        <Minus className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Nie podano</span>
      </div>
    );
  }

  // Determine if this is a "good" or "bad" status
  const isGood = isPositiveWhenTrue ? value : !value;

  return (
    <div className="flex items-center gap-2">
      {isGood ? (
        <>
          <Check className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium text-green-600">
            {isPositiveWhenTrue ? "Tak" : "Nie"}
          </span>
        </>
      ) : (
        <>
          <X className="h-4 w-4 text-destructive" />
          <span className="text-sm font-medium text-destructive">
            {isPositiveWhenTrue ? "Nie" : "Tak"}
          </span>
        </>
      )}
    </div>
  );
};

const ConditionRow = ({ item }: { item: ConditionItem }) => (
  <div className="flex items-center justify-between py-3 px-4 bg-background/50 rounded border border-accent/20">
    <span className="text-sm text-body-text">{item.label}</span>
    <ConditionIndicator value={item.value} isPositiveWhenTrue={item.isPositiveWhenTrue} />
  </div>
);

export const VehicleHealthReport = ({ car }: VehicleHealthReportProps) => {
  // Body/Interior conditions - these are BAD when true (defects)
  const bodyInteriorItems: ConditionItem[] = [
    { label: "Rysy na karoserii", value: car.hasScratches, isPositiveWhenTrue: false },
    { label: "Wgniecenia", value: car.hasDents, isPositiveWhenTrue: false },
    { label: "Rdza", value: car.hasRust, isPositiveWhenTrue: false },
    { label: "Plamy we wnętrzu", value: car.hasInteriorStains, isPositiveWhenTrue: false },
  ];

  // Mechanical conditions - mixed: some are bad when true (faults), some are good when true (working)
  const mechanicalItems: ConditionItem[] = [
    { label: "Silnik dymi", value: car.engineSmokes, isPositiveWhenTrue: false },
    { label: "Usterki silnika", value: car.engineFaults, isPositiveWhenTrue: false },
    { label: "Usterki skrzyni biegów", value: car.gearboxFaults, isPositiveWhenTrue: false },
    { label: "Hałaśliwe hamulce", value: car.brakesNoisy, isPositiveWhenTrue: false },
    { label: "Hałaśliwe zawieszenie", value: car.suspensionNoisy, isPositiveWhenTrue: false },
    { label: "Usterki elektryczne", value: car.electricalFaults, isPositiveWhenTrue: false },
    { label: "Kontrolki ostrzegawcze", value: car.warningLightsOn, isPositiveWhenTrue: false },
    { label: "Klimatyzacja sprawna", value: car.acWorking, isPositiveWhenTrue: true },
    { label: "Szyby sprawne", value: car.windowsWorking, isPositiveWhenTrue: true },
    { label: "Silnik pracuje płynnie", value: car.runsSmoothly, isPositiveWhenTrue: true },
    { label: "Legalna głębokość opon", value: car.tiresLegalDepth, isPositiveWhenTrue: true },
  ];

  // Check if we have any data to show
  const hasBodyData = bodyInteriorItems.some(item => item.value !== null && item.value !== undefined);
  const hasMechanicalData = mechanicalItems.some(item => item.value !== null && item.value !== undefined);

  if (!hasBodyData && !hasMechanicalData) {
    return null;
  }

  return (
    <div className="border border-accent/30 rounded-lg overflow-hidden bg-muted/30">
      {/* Header */}
      <div className="bg-primary/10 border-b border-accent/30 px-6 py-4">
        <div className="flex items-center gap-3">
          <ClipboardList className="h-6 w-6 text-primary" />
          <h3 className="font-kanit font-semibold text-xl text-body-text uppercase tracking-wide">
            Raport Stanu Technicznego Pojazdu
          </h3>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Body/Interior Section */}
        {hasBodyData && (
          <div>
            <h4 className="text-sm font-semibold text-subtitle-text uppercase tracking-wider mb-3 border-b border-accent/20 pb-2">
              Nadwozie i Wnętrze
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {bodyInteriorItems.map((item, index) => (
                <ConditionRow key={index} item={item} />
              ))}
            </div>
          </div>
        )}

        {/* Mechanical/Systems Section */}
        {hasMechanicalData && (
          <div>
            <h4 className="text-sm font-semibold text-subtitle-text uppercase tracking-wider mb-3 border-b border-accent/20 pb-2">
              Układ Mechaniczny i Systemy
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {mechanicalItems.map((item, index) => (
                <ConditionRow key={index} item={item} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
