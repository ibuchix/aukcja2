
import { useState } from "react";
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, Search } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BidMonitoringFilters } from "./types";

interface BidFiltersProps {
  filters: BidMonitoringFilters;
  onFiltersChange: (filters: BidMonitoringFilters) => void;
}

export const BidFilters = ({ filters, onFiltersChange }: BidFiltersProps) => {
  const [searchQuery, setSearchQuery] = useState(filters.searchQuery || "");
  
  const handleTimeRangeChange = (value: string) => {
    onFiltersChange({
      ...filters,
      timeRange: value as BidMonitoringFilters['timeRange']
    });
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFiltersChange({
      ...filters,
      searchQuery
    });
  };
  
  const handleActivityTypeChange = (type: string, checked: boolean) => {
    const currentTypes = filters.activityTypes || [];
    
    if (checked && !currentTypes.includes(type)) {
      onFiltersChange({
        ...filters,
        activityTypes: [...currentTypes, type]
      });
    } else if (!checked && currentTypes.includes(type)) {
      onFiltersChange({
        ...filters,
        activityTypes: currentTypes.filter(t => t !== type)
      });
    }
  };
  
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
      {/* Time Range Filter */}
      <div className="w-full sm:w-auto">
        <Select 
          value={filters.timeRange || 'all'} 
          onValueChange={handleTimeRangeChange}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <Clock className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Time Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="last_hour">Last Hour</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="last_week">Last 7 Days</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      
      {/* Activity Type Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full sm:w-auto">
            <CheckCircle className="h-4 w-4 mr-2" />
            Activity Types
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px]">
          <div className="space-y-2">
            <div className="font-medium text-sm">Activity Types</div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="new_bid" 
                  checked={filters.activityTypes?.includes('new_bid')}
                  onCheckedChange={(checked) => 
                    handleActivityTypeChange('new_bid', checked === true)
                  }
                />
                <Label htmlFor="new_bid">New Bids</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="outbid" 
                  checked={filters.activityTypes?.includes('outbid')}
                  onCheckedChange={(checked) => 
                    handleActivityTypeChange('outbid', checked === true)
                  }
                />
                <Label htmlFor="outbid">Outbid</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="won" 
                  checked={filters.activityTypes?.includes('won')}
                  onCheckedChange={(checked) => 
                    handleActivityTypeChange('won', checked === true)
                  }
                />
                <Label htmlFor="won">Won Auctions</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="lost" 
                  checked={filters.activityTypes?.includes('lost')}
                  onCheckedChange={(checked) => 
                    handleActivityTypeChange('lost', checked === true)
                  }
                />
                <Label htmlFor="lost">Lost Auctions</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="proxy_executed" 
                  checked={filters.activityTypes?.includes('proxy_executed')}
                  onCheckedChange={(checked) => 
                    handleActivityTypeChange('proxy_executed', checked === true)
                  }
                />
                <Label htmlFor="proxy_executed">Proxy Bids</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="auction_ended" 
                  checked={filters.activityTypes?.includes('auction_ended')}
                  onCheckedChange={(checked) => 
                    handleActivityTypeChange('auction_ended', checked === true)
                  }
                />
                <Label htmlFor="auction_ended">Auction Ended</Label>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      
      {/* Search Input */}
      <form 
        onSubmit={handleSearchSubmit} 
        className="w-full sm:w-auto flex-1 sm:max-w-sm"
      >
        <div className="flex">
          <Input
            placeholder="Search car title..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="rounded-r-none"
          />
          <Button type="submit" variant="default" className="rounded-l-none">
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
};
