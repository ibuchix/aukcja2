
import { Shield, Check, X } from "lucide-react";
import { CarListing } from "@/types/cars";
import { Badge } from "@/components/ui/badge";

interface ConditionAndFeaturesProps {
  car: CarListing;
}

export const ConditionAndFeatures = ({ car }: ConditionAndFeaturesProps) => {
  const features = car.features || {};
  
  const featureList = [
    { key: 'satNav', label: 'Satellite Navigation', value: features.satNav },
    { key: 'heatedSeats', label: 'Heated Seats', value: features.heatedSeats },
    { key: 'panoramicRoof', label: 'Panoramic Roof', value: features.panoramicRoof },
    { key: 'reverseCamera', label: 'Reverse Camera', value: features.reverseCamera },
    { key: 'upgradedSound', label: 'Upgraded Sound System', value: features.upgradedSound },
  ];

  return (
    <div className="space-y-6">
      {/* Condition Section */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-body-text">
          <Shield className="h-5 w-5 text-body-text" />
          Vehicle Condition
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg border border-secondary/30">
            <span className="font-medium text-body-text">Damage Status</span>
            <Badge variant={car.isDamaged ? "destructive" : "default"}>
              {car.isDamaged ? "Has Damage" : "No Known Damage"}
            </Badge>
          </div>
          
          {car.transmission && (
            <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg border border-secondary/30">
              <span className="font-medium text-body-text">Transmission</span>
              <Badge variant="outline">{car.transmission}</Badge>
            </div>
          )}
          
          {car.seatMaterial && (
            <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg border border-secondary/30">
              <span className="font-medium text-body-text">Seat Material</span>
              <Badge variant="outline">{car.seatMaterial}</Badge>
            </div>
          )}
          
          {car.numberOfKeys && (
            <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg border border-secondary/30">
              <span className="font-medium text-body-text">Number of Keys</span>
              <Badge variant="outline">{car.numberOfKeys}</Badge>
            </div>
          )}
        </div>
      </div>

      {/* Features Section */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-body-text">Vehicle Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {featureList.map((feature) => (
            <div 
              key={feature.key} 
              className="flex items-center gap-3 p-3 bg-secondary/20 rounded-lg border border-secondary/30"
            >
              {feature.value ? (
                <>
                  <Check className="h-5 w-5 text-green-600" />
                  <Badge 
                    variant="default" 
                    className="bg-green-100 text-green-800 hover:bg-green-200 border-green-300"
                  >
                    {feature.label}
                  </Badge>
                </>
              ) : (
                <>
                  <X className="h-5 w-5 text-gray-400" />
                  <span className="text-subtitle-text">{feature.label}</span>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Additional Information */}
      {(car.serviceHistoryType || car.hasServiceHistory !== undefined || car.isRegisteredInPoland !== undefined) && (
        <div>
          <h3 className="text-lg font-semibold mb-4 text-body-text">Additional Information</h3>
          <div className="space-y-3">
            {car.serviceHistoryType && (
              <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg border border-secondary/30">
                <span className="font-medium text-body-text">Service History</span>
                <Badge variant="outline">{car.serviceHistoryType}</Badge>
              </div>
            )}
            
            {car.hasServiceHistory !== undefined && (
              <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg border border-secondary/30">
                <span className="font-medium text-body-text">Service History Available</span>
                <Badge variant={car.hasServiceHistory ? "default" : "secondary"}>
                  {car.hasServiceHistory ? "Yes" : "No"}
                </Badge>
              </div>
            )}
            
            {car.isRegisteredInPoland !== undefined && (
              <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg border border-secondary/30">
                <span className="font-medium text-body-text">Registered in Poland</span>
                <Badge variant={car.isRegisteredInPoland ? "default" : "secondary"}>
                  {car.isRegisteredInPoland ? "Yes" : "No"}
                </Badge>
              </div>
            )}
            
            {car.hasPrivatePlate !== undefined && (
              <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg border border-secondary/30">
                <span className="font-medium text-body-text">Private Plate</span>
                <Badge variant={car.hasPrivatePlate ? "default" : "secondary"}>
                  {car.hasPrivatePlate ? "Yes" : "No"}
                </Badge>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Seller Notes */}
      {car.sellerNotes && (
        <div>
          <h3 className="text-lg font-semibold mb-4 text-body-text">Seller Notes</h3>
          <div className="p-4 bg-iris/20 border-l-4 border-iris rounded-lg">
            <p className="text-body-text">{car.sellerNotes}</p>
          </div>
        </div>
      )}
    </div>
  );
};
