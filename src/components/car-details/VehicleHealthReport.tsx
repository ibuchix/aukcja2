import { Check, X, Minus, ClipboardList, Shield } from "lucide-react";
import { CarListing } from "@/types/cars";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

interface VehicleHealthReportProps {
  car: CarListing;
}

interface ConditionItem {
  label: string;
  value: boolean | null | undefined;
  isPositiveWhenTrue: boolean;
  type: 'defect' | 'working' | 'issue';
}

const getStatusLabel = (value: boolean | null | undefined, isPositiveWhenTrue: boolean, type: ConditionItem['type']) => {
  if (value === null || value === undefined) {
    return { text: "BRAK DANYCH", isGood: null };
  }
  
  const isGood = isPositiveWhenTrue ? value : !value;
  
  switch (type) {
    case 'defect':
      return { text: isGood ? "BRAK" : "WYKRYTO", isGood };
    case 'working':
      return { text: isGood ? "SPRAWNE" : "NIESPRAWNE", isGood };
    case 'issue':
      return { text: isGood ? "BRAK USTEREK" : "USTERKA", isGood };
  }
};

const StatusIndicator = ({ 
  value, 
  isPositiveWhenTrue,
  type
}: { 
  value: boolean | null | undefined; 
  isPositiveWhenTrue: boolean;
  type: ConditionItem['type'];
}) => {
  const status = getStatusLabel(value, isPositiveWhenTrue, type);

  if (status.isGood === null) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
          <Minus className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {status.text}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className={cn(
        "w-6 h-6 rounded-full flex items-center justify-center",
        status.isGood ? "bg-green-500/20" : "bg-destructive/20"
      )}>
        {status.isGood ? (
          <Check className="h-3.5 w-3.5 text-green-500" />
        ) : (
          <X className="h-3.5 w-3.5 text-destructive" />
        )}
      </div>
      <span className={cn(
        "text-xs font-semibold uppercase tracking-wide",
        status.isGood ? "text-green-500" : "text-destructive"
      )}>
        {status.text}
      </span>
    </div>
  );
};

const ConditionRow = ({ item, index }: { item: ConditionItem; index: number }) => (
  <div className={cn(
    "flex items-center justify-between py-3 px-4 rounded-md",
    index % 2 === 0 ? "bg-background/30" : "bg-background/50"
  )}>
    <span className="text-sm text-body-text font-medium">{item.label}</span>
    <StatusIndicator value={item.value} isPositiveWhenTrue={item.isPositiveWhenTrue} type={item.type} />
  </div>
);

const CategorySection = ({ 
  number, 
  title, 
  items 
}: { 
  number: string; 
  title: string; 
  items: ConditionItem[];
}) => {
  const itemsWithData = items.filter(item => item.value !== null && item.value !== undefined);
  const goodItems = itemsWithData.filter(item => 
    item.isPositiveWhenTrue ? item.value === true : item.value === false
  );
  const categoryScore = itemsWithData.length > 0 ? Math.round((goodItems.length / itemsWithData.length) * 100) : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between border-b border-accent/30 pb-2">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded">
            {number}
          </span>
          <h4 className="text-sm font-semibold text-body-text uppercase tracking-wider">
            {title}
          </h4>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-xs font-semibold px-2 py-1 rounded",
            categoryScore >= 70 ? "bg-green-500/20 text-green-500" :
            categoryScore >= 50 ? "bg-yellow-500/20 text-yellow-500" :
            "bg-destructive/20 text-destructive"
          )}>
            {goodItems.length}/{itemsWithData.length} Pozytywne
          </span>
        </div>
      </div>
      
      {/* Category Progress Bar */}
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div 
          className={cn(
            "h-full rounded-full transition-all",
            categoryScore >= 70 ? "bg-green-500" :
            categoryScore >= 50 ? "bg-yellow-500" :
            "bg-destructive"
          )}
          style={{ width: `${categoryScore}%` }}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
        {items.map((item, index) => (
          <ConditionRow key={index} item={item} index={index} />
        ))}
      </div>
    </div>
  );
};

const getHealthGrade = (score: number): { label: string; color: string } => {
  if (score >= 90) return { label: "DOSKONAŁY", color: "text-green-500" };
  if (score >= 70) return { label: "BARDZO DOBRY", color: "text-green-500" };
  if (score >= 50) return { label: "DOBRY", color: "text-yellow-500" };
  if (score >= 30) return { label: "DOSTATECZNY", color: "text-orange-500" };
  return { label: "WYMAGA UWAGI", color: "text-destructive" };
};

export const VehicleHealthReport = ({ car }: VehicleHealthReportProps) => {
  // Body/Interior conditions - these are BAD when true (defects)
  const bodyInteriorItems: ConditionItem[] = [
    { label: "Rysy na karoserii", value: car.hasScratches, isPositiveWhenTrue: false, type: 'defect' },
    { label: "Wgniecenia", value: car.hasDents, isPositiveWhenTrue: false, type: 'defect' },
    { label: "Rdza", value: car.hasRust, isPositiveWhenTrue: false, type: 'defect' },
    { label: "Plamy we wnętrzu", value: car.hasInteriorStains, isPositiveWhenTrue: false, type: 'defect' },
  ];

  // Mechanical conditions - mixed types
  const mechanicalItems: ConditionItem[] = [
    { label: "Silnik dymi", value: car.engineSmokes, isPositiveWhenTrue: false, type: 'issue' },
    { label: "Usterki silnika", value: car.engineFaults, isPositiveWhenTrue: false, type: 'issue' },
    { label: "Usterki skrzyni biegów", value: car.gearboxFaults, isPositiveWhenTrue: false, type: 'issue' },
    { label: "Hałaśliwe hamulce", value: car.brakesNoisy, isPositiveWhenTrue: false, type: 'issue' },
    { label: "Hałaśliwe zawieszenie", value: car.suspensionNoisy, isPositiveWhenTrue: false, type: 'issue' },
    { label: "Usterki elektryczne", value: car.electricalFaults, isPositiveWhenTrue: false, type: 'issue' },
    { label: "Kontrolki ostrzegawcze", value: car.warningLightsOn, isPositiveWhenTrue: false, type: 'issue' },
    { label: "Klimatyzacja", value: car.acWorking, isPositiveWhenTrue: true, type: 'working' },
    { label: "Szyby elektryczne", value: car.windowsWorking, isPositiveWhenTrue: true, type: 'working' },
    { label: "Praca silnika", value: car.runsSmoothly, isPositiveWhenTrue: true, type: 'working' },
    { label: "Głębokość bieżnika opon", value: car.tiresLegalDepth, isPositiveWhenTrue: true, type: 'working' },
  ];

  // Check if we have any data to show
  const allItems = [...bodyInteriorItems, ...mechanicalItems];
  const hasData = allItems.some(item => item.value !== null && item.value !== undefined);

  if (!hasData) {
    return null;
  }

  // Calculate overall health score
  const itemsWithData = allItems.filter(item => item.value !== null && item.value !== undefined);
  const goodItems = itemsWithData.filter(item => 
    item.isPositiveWhenTrue ? item.value === true : item.value === false
  );
  const healthScore = Math.round((goodItems.length / itemsWithData.length) * 100);
  const healthGrade = getHealthGrade(healthScore);

  // Generate document number from car ID
  const documentNumber = `VHR-${new Date().getFullYear()}-${car.id?.substring(0, 8).toUpperCase() || 'XXXXXXXX'}`;
  const reportDate = format(new Date(), "d MMMM yyyy", { locale: pl });

  return (
    <div className="border-l-4 border-primary rounded-lg overflow-hidden bg-muted/30 shadow-md">
      {/* Document Header */}
      <div className="bg-muted/50 border-b border-accent/30 px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <ClipboardList className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-kanit font-bold text-lg text-body-text uppercase tracking-wide">
                Raport Stanu Technicznego
              </h3>
              <p className="text-xs text-subtitle-text">
                Oficjalna ocena stanu pojazdu
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-subtitle-text">
            <span className="font-mono">
              Nr: <span className="text-body-text font-medium">{documentNumber}</span>
            </span>
            <span>
              {reportDate}
            </span>
          </div>
        </div>
      </div>

      {/* Overall Health Score */}
      <div className="px-6 py-5 bg-background/50 border-b border-accent/30">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center gap-3">
            <Shield className={cn("h-8 w-8", healthGrade.color)} />
            <div>
              <p className="text-xs text-subtitle-text uppercase tracking-wide">Ogólna ocena stanu</p>
              <p className={cn("text-2xl font-bold", healthGrade.color)}>
                {healthScore}%
              </p>
            </div>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className={cn("text-sm font-bold uppercase tracking-wide", healthGrade.color)}>
                {healthGrade.label}
              </span>
              <span className="text-xs text-subtitle-text">
                {goodItems.length} z {itemsWithData.length} punktów kontrolnych pozytywnych
              </span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full transition-all",
                  healthScore >= 70 ? "bg-green-500" :
                  healthScore >= 50 ? "bg-yellow-500" :
                  "bg-destructive"
                )}
                style={{ width: `${healthScore}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Condition Sections */}
      <div className="p-6 space-y-6">
        <CategorySection 
          number="1.0" 
          title="Nadwozie i Wnętrze" 
          items={bodyInteriorItems} 
        />
        
        <CategorySection 
          number="2.0" 
          title="Układ Mechaniczny i Systemy" 
          items={mechanicalItems} 
        />
      </div>

    </div>
  );
};
