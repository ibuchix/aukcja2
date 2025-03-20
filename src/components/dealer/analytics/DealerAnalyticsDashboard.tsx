
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BidAnalyticsCard } from "./BidAnalyticsCard";
import { BidAnalyticsDateRangePicker } from "./BidAnalyticsDateRangePicker";
import { BidAnalyticsFilters } from "./types";
import { useAnalyticsData } from "@/hooks/useAnalyticsData";
import { BarChart3 } from "lucide-react";

export function DealerAnalyticsDashboard() {
  const [filters, setFilters] = useState<BidAnalyticsFilters>({
    dateRange: 'month'
  });

  const { analyticsData, isLoading, error } = useAnalyticsData(filters);

  const handleFilterChange = (newFilters: BidAnalyticsFilters) => {
    setFilters(newFilters);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-heading-md font-oswald flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Bid Analytics Dashboard
              </CardTitle>
              <CardDescription>
                Track your bidding performance and market comparisons
              </CardDescription>
            </div>
            <BidAnalyticsDateRangePicker 
              filters={filters} 
              onFilterChange={handleFilterChange} 
            />
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-red-500 p-4 rounded-md border border-red-200 bg-red-50">
              Error loading analytics: {error}
            </div>
          ) : (
            <BidAnalyticsCard analyticsData={analyticsData} isLoading={isLoading} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
