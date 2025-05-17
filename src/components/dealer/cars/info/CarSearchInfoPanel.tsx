
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { InfoIcon, Clock, Calendar, BadgePercent } from "lucide-react";

export const CarSearchInfoPanel = () => {
  return (
    <Card className="bg-muted/30">
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex items-start gap-3 flex-1">
            <InfoIcon className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h3 className="font-medium mb-1">Car Search</h3>
              <p className="text-sm text-muted-foreground">
                Find and bid on available vehicles from our extensive inventory. Use the filters to narrow down your search.
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:w-1/2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Updated daily</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Regular auctions</span>
            </div>
            
            <div className="flex items-center gap-2">
              <BadgePercent className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Exclusive deals</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
