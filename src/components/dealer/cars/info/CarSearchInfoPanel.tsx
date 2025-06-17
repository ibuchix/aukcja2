
import { Card, CardContent } from "@/components/ui/card";
import { Gavel, Shield, Clock } from "lucide-react";

export const CarSearchInfoPanel = () => {
  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <CardContent className="pt-6">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <Gavel className="h-8 w-8 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Live Auction Marketplace
            </h3>
            <p className="text-blue-700 mb-4">
              Browse and bid on vehicles currently in live auction. Only active auctions are shown to verified dealers.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-green-600" />
                <span className="text-blue-800">Verified dealers only</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-orange-600" />
                <span className="text-blue-800">Live auctions only</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
