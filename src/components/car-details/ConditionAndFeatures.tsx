
import { AlertTriangle, CheckCircle, XCircle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CarListing } from "@/types/cars";

interface ConditionAndFeaturesProps {
  car: CarListing;
}

const ConditionAndFeatures = ({ car }: ConditionAndFeaturesProps) => {
  const renderConditionRating = () => {
    if (!car.condition_rating) return null;
    
    const rating = car.condition_rating;
    const getConditionColor = (rating: number) => {
      if (rating >= 8) return "text-green-600";
      if (rating >= 6) return "text-yellow-600";
      return "text-red-600";
    };
    
    const getConditionText = (rating: number) => {
      if (rating >= 8) return "Excellent";
      if (rating >= 6) return "Good";
      if (rating >= 4) return "Fair";
      return "Poor";
    };

    return (
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Condition Rating:</span>
        <span className={`text-lg font-bold ${getConditionColor(rating)}`}>
          {rating}/10 ({getConditionText(rating)})
        </span>
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Vehicle Condition & Features
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Condition Rating */}
        {car.condition_rating && (
          <div className="p-4 bg-gray-50 rounded-lg">
            {renderConditionRating()}
          </div>
        )}

        {/* Damage Information */}
        <div className="space-y-3">
          <h4 className="font-semibold text-lg">Damage & Condition Status</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              {car.is_damaged ? (
                <XCircle className="w-5 h-5 text-red-500" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
              <span className="font-medium">
                {car.is_damaged ? "Damage Reported" : "No Damage Reported"}
              </span>
            </div>
          </div>

          {/* Seller Notes */}
          {car.seller_notes && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <h5 className="font-medium text-gray-800 mb-2">Seller Notes:</h5>
              <p className="text-gray-700">{car.seller_notes}</p>
            </div>
          )}
        </div>

        {/* Service History */}
        {car.service_history_type && (
          <div className="space-y-2">
            <h4 className="font-semibold">Service History</h4>
            <Badge variant="outline" className="capitalize">
              {car.service_history_type.replace(/_/g, ' ')}
            </Badge>
            {car.has_service_history && (
              <p className="text-sm text-green-600 mt-2">
                <CheckCircle className="w-4 h-4 inline mr-1" />
                Service history available
              </p>
            )}
          </div>
        )}

        {/* Features */}
        {car.features && (
          <div className="space-y-3">
            <h4 className="font-semibold">Vehicle Features</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {Object.entries(car.features).map(
                ([key, value]) =>
                  value && (
                    <Badge key={key} variant="success" className="justify-start">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {key
                        .replace(/([A-Z])/g, " $1")
                        .replace(/^./, (str) => str.toUpperCase())}
                    </Badge>
                  )
              )}
            </div>
          </div>
        )}

        {/* Show message if no condition information available */}
        {!car.is_damaged && 
         !car.condition_rating && 
         !car.seller_notes && 
         !car.service_history_type && (
          <div className="p-4 bg-gray-50 rounded-lg flex items-center gap-2">
            <Info className="w-5 h-5 text-gray-500" />
            <span className="text-gray-600">No specific condition information available for this vehicle.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ConditionAndFeatures;
