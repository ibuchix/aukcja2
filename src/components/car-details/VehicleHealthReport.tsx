import { ClipboardList, Shield } from "lucide-react";
import { CarListing } from "@/types/cars";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { useIsMobile } from "@/hooks/use-mobile";

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
  
  // For defects/issues: isGood means problem is NOT present, so we say "Nie" (no problem)
  // For working: isGood means it IS working, so we say "Tak" (yes, it works)
  if (type === 'working') {
    return { text: isGood ? "Tak" : "Nie", isGood };
  }
  // For defects and issues: "Tak" means problem exists, "Nie" means no problem
  return { text: isGood ? "Nie" : "Tak", isGood };
};

const StatusIndicator = ({ 
  value, 
  isPositiveWhenTrue,
  type,
  isMobile
}: { 
  value: boolean | null | undefined; 
  isPositiveWhenTrue: boolean;
  type: ConditionItem['type'];
  isMobile: boolean;
}) => {
  const status = getStatusLabel(value, isPositiveWhenTrue, type);

  if (status.isGood === null) {
    return (
      <span className={cn(
        "font-normal text-muted-foreground tracking-wide",
        isMobile ? "text-xs" : "text-sm"
      )}>
        {status.text.toLowerCase()}
      </span>
    );
  }

  return (
    <span className={cn(
      "font-normal tracking-wide text-body-text",
      isMobile ? "text-xs" : "text-sm"
    )}>
      {status.text.toLowerCase()}
    </span>
  );
};

const ConditionRow = ({ item, index, isMobile }: { item: ConditionItem; index: number; isMobile: boolean }) => (
  <div className={cn(
    "flex items-center justify-between rounded-md",
    isMobile ? "py-2 px-2" : "py-3 px-4",
    index % 2 === 0 ? "bg-background/30" : "bg-background/50"
  )}>
    <span className={cn(
      "text-body-text font-medium",
      isMobile ? "text-xs" : "text-base"
    )}>{item.label}</span>
    <StatusIndicator value={item.value} isPositiveWhenTrue={item.isPositiveWhenTrue} type={item.type} isMobile={isMobile} />
  </div>
);

const CategorySection = ({ 
  number, 
  title, 
  items,
  isMobile
}: { 
  number: string; 
  title: string; 
  items: ConditionItem[];
  isMobile: boolean;
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
          <span className={cn(
            "font-bold text-primary bg-primary/10 rounded",
            isMobile ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-1"
          )}>
            {number}
          </span>
          <h4 className={cn(
            "font-semibold text-body-text uppercase tracking-wider",
            isMobile ? "text-xs" : "text-sm"
          )}>
            {title}
          </h4>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(
            "font-semibold rounded",
            isMobile ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-1",
            categoryScore >= 70 ? "bg-green-500/20 text-green-500" :
            categoryScore >= 50 ? "bg-yellow-500/20 text-yellow-500" :
            "bg-destructive/20 text-destructive"
          )}>
            {goodItems.length}/{itemsWithData.length}
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

      <div className="grid grid-cols-2 gap-1">
        {items.map((item, index) => (
          <ConditionRow key={index} item={item} index={index} isMobile={isMobile} />
        ))}
      </div>
    </div>
  );
};


export const VehicleHealthReport = ({ car }: VehicleHealthReportProps) => {
  const isMobile = useIsMobile();
  
  // Body/Interior conditions - these are BAD when true (defects)
  const bodyInteriorItems: ConditionItem[] = [
    { label: "Rysy na karoserii?", value: car.hasScratches, isPositiveWhenTrue: false, type: 'defect' },
    { label: "Wgniecenia na karoserii?", value: car.hasDents, isPositiveWhenTrue: false, type: 'defect' },
    { label: "Rdza na karoserii?", value: car.hasRust, isPositiveWhenTrue: false, type: 'defect' },
    { label: "Plamy we wnętrzu?", value: car.hasInteriorStains, isPositiveWhenTrue: false, type: 'defect' },
  ];

  // Mechanical conditions - mixed types
  const mechanicalItems: ConditionItem[] = [
    { label: "Silnik dymi lub pracuje nierówno?", value: car.engineSmokes, isPositiveWhenTrue: false, type: 'issue' },
    { label: "Usterki silnika?", value: car.engineFaults, isPositiveWhenTrue: false, type: 'issue' },
    { label: "Usterki skrzyni biegów?", value: car.gearboxFaults, isPositiveWhenTrue: false, type: 'issue' },
    { label: "Hałaśliwe hamulce?", value: car.brakesNoisy, isPositiveWhenTrue: false, type: 'issue' },
    { label: "Hałaśliwe zawieszenie?", value: car.suspensionNoisy, isPositiveWhenTrue: false, type: 'issue' },
    { label: "Usterki elektryczne?", value: car.electricalFaults, isPositiveWhenTrue: false, type: 'issue' },
    { label: "Zapalone kontrolki ostrzegawcze?", value: car.warningLightsOn, isPositiveWhenTrue: false, type: 'issue' },
    { label: "Klimatyzacja działa?", value: car.acWorking, isPositiveWhenTrue: true, type: 'working' },
    { label: "Szyby działają prawidłowo?", value: car.windowsWorking, isPositiveWhenTrue: true, type: 'working' },
    { label: "Samochód jeździ prawidłowo?", value: car.runsSmoothly, isPositiveWhenTrue: true, type: 'working' },
    { label: "Bieżnik opon legalny?", value: car.tiresLegalDepth, isPositiveWhenTrue: true, type: 'working' },
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
  

  // Generate document number from car ID
  const documentNumber = `VHR-${new Date().getFullYear()}-${car.id?.substring(0, 8).toUpperCase() || 'XXXXXXXX'}`;
  const reportDate = format(new Date(), "d MMMM yyyy", { locale: pl });

  return (
    <div className="border-l-4 border-primary rounded-lg overflow-hidden bg-muted/30 shadow-md">
      {/* Document Header */}
      <div className={cn(
        "bg-muted/50 border-b border-accent/30",
        isMobile ? "px-4 py-3" : "px-6 py-4"
      )}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              "rounded-lg bg-primary/20 flex items-center justify-center",
              isMobile ? "w-8 h-8" : "w-10 h-10"
            )}>
              <ClipboardList className={cn(isMobile ? "h-4 w-4" : "h-5 w-5", "text-primary")} />
            </div>
            <div>
              <h3 className={cn(
                "font-kanit font-bold text-body-text uppercase tracking-wide",
                isMobile ? "text-sm" : "text-lg"
              )}>
                Raport Stanu Technicznego
              </h3>
              <p className={cn(
                "text-subtitle-text",
                isMobile ? "text-[10px]" : "text-xs"
              )}>
                Oficjalna ocena stanu pojazdu
              </p>
            </div>
          </div>
          <div className={cn(
            "flex items-center gap-4 text-subtitle-text",
            isMobile ? "text-[10px]" : "text-xs"
          )}>
            <span className="font-mono">
              Nr: <span className="text-body-text font-medium">{isMobile ? documentNumber.slice(-8) : documentNumber}</span>
            </span>
            <span>
              {reportDate}
            </span>
          </div>
        </div>
      </div>

      {/* Overall Health Score */}
      <div className={cn(
        "bg-background/50 border-b border-accent/30",
        isMobile ? "px-4 py-4" : "px-6 py-5"
      )}>
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center gap-3">
            <Shield className={cn(
              isMobile ? "h-6 w-6" : "h-8 w-8",
              healthScore >= 70 ? "text-green-500" : healthScore >= 50 ? "text-yellow-500" : "text-destructive"
            )} />
            <div>
              <p className={cn(
                "text-subtitle-text uppercase tracking-wide",
                isMobile ? "text-[10px]" : "text-xs"
              )}>Ogólna ocena stanu</p>
              <p className={cn(
                "font-bold",
                isMobile ? "text-xl" : "text-2xl",
                healthScore >= 70 ? "text-green-500" : healthScore >= 50 ? "text-yellow-500" : "text-destructive"
              )}>
                {healthScore}%
              </p>
            </div>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-end mb-1.5">
              <span className={cn(
                "text-subtitle-text",
                isMobile ? "text-[10px]" : "text-xs"
              )}>
                {goodItems.length} z {itemsWithData.length} poz.
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
      <div className={cn(
        "space-y-6",
        isMobile ? "p-4" : "p-6"
      )}>
        <CategorySection 
          number="1.0" 
          title="Nadwozie i Wnętrze" 
          items={bodyInteriorItems}
          isMobile={isMobile}
        />
        
        <CategorySection 
          number="2.0" 
          title="Układ Mechaniczny i Systemy" 
          items={mechanicalItems}
          isMobile={isMobile}
        />
      </div>

    </div>
  );
};
