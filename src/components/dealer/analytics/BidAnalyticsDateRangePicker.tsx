
import { BidAnalyticsFilters } from "./types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BidAnalyticsDateRangePickerProps {
  filters: BidAnalyticsFilters;
  onFilterChange: (filters: BidAnalyticsFilters) => void;
  onChange?: (range: { from: Date; to: Date } | undefined) => void;
  currentRange?: { from: Date; to: Date } | undefined;
}

export function BidAnalyticsDateRangePicker({ 
  filters, 
  onFilterChange,
  onChange,
  currentRange
}: BidAnalyticsDateRangePickerProps) {
  const handleDateRangeChange = (value: string) => {
    onFilterChange({
      ...filters,
      dateRange: value as BidAnalyticsFilters['dateRange']
    });

    if (onChange) {
      // Convert selection to date range for components that expect this format
      const now = new Date();
      let from = new Date();
      
      switch(value) {
        case 'week':
          from.setDate(now.getDate() - 7);
          break;
        case 'month':
          from.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          from.setMonth(now.getMonth() - 3);
          break;
        case 'year':
          from.setFullYear(now.getFullYear() - 1);
          break;
        case 'all':
          from = new Date(2020, 0, 1); // Some arbitrarily old date
          break;
      }
      
      onChange({ from, to: now });
    }
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
