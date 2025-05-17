
import React from "react";
import { Info } from "lucide-react";

export const CarSearchInfoPanel = () => {
  return (
    <div className="bg-blue-50 p-4 rounded-lg flex items-start space-x-3 border border-blue-100">
      <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
      <div>
        <h4 className="font-medium text-blue-800">Car Browsing Made Easy</h4>
        <p className="text-sm text-blue-600">
          Search, filter, and find the perfect vehicles directly from your dashboard.
          No need to navigate away - all vehicles are available here!
        </p>
      </div>
    </div>
  );
};
