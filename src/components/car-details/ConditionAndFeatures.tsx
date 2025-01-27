import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CarListing } from "@/types/cars";

interface ConditionAndFeaturesProps {
  car: CarListing;
}

const ConditionAndFeatures = ({ car }: ConditionAndFeaturesProps) => (
  <div className="space-y-4 p-4 bg-accent/50 rounded-lg">
    <h3 className="text-lg font-semibold font-oswald flex items-center gap-2">
      <AlertTriangle className="w-5 h-5" />
      Condition & Damages
    </h3>
    <div className="space-y-2">
      {car.is_damaged && (
        <Badge variant="destructive">Reported Damage</Badge>
      )}
      <div className="grid grid-cols-1 gap-4">
        {car.features && (
          <div>
            <p className="text-subtitle-text mb-2">Features</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(car.features).map(
                ([key, value]) =>
                  value && (
                    <Badge key={key} variant="secondary">
                      {key
                        .replace(/([A-Z])/g, " $1")
                        .replace(/^./, (str) => str.toUpperCase())}
                    </Badge>
                  )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);

export default ConditionAndFeatures;