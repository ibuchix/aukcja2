
import { BidAnalyticsFilters } from "./types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BidAnalyticsDateRangePickerProps {
  filters: BidAnalyticsFilters;
  onFilterChange: (filters: BidAnalyticsFilters) => void;
}

export function BidAnalyticsDateRangePicker({ filters, onFilterChange }: BidAnalyticsDateRangePickerProps) {
  const handleDateRangeChange = (value: string) => {
    onFilterChange({
      ...filters,
      dateRange: value as BidAnalyticsFilters['dateRange']
    });
  };

  return (
    <div className="flex items-center space-x-4">
      <div className="space-y-1">
        <label htmlFor="date-range" className="text-sm font-medium">
          Date Range
        </label>
        <Select
          value={filters.dateRange}
          onValueChange={handleDateRangeChange}
        >
          <SelectTrigger id="date-range" className="w-[180px]">
            <SelectValue placeholder="Select date range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Past Week</SelectItem>
            <SelectItem value="month">Past Month</SelectItem>
            <SelectItem value="quarter">Past 3 Months</SelectItem>
            <SelectItem value="year">Past Year</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
