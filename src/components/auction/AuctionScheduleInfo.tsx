
import { Clock, Calendar, AlertCircle, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatUKDateTime } from "@/utils/ukTimeUtils";

interface AuctionScheduleInfoProps {
  scheduleStatus?: string;
  scheduleStartTime?: string;
  scheduleEndTime?: string;
  auctionTimingStatus?: 'scheduled' | 'active' | 'ended' | 'unknown';
  className?: string;
}

export const AuctionScheduleInfo = ({
  scheduleStatus,
  scheduleStartTime,
  scheduleEndTime,
  auctionTimingStatus,
  className = ""
}: AuctionScheduleInfoProps) => {
  const getStatusBadge = () => {
    switch (auctionTimingStatus) {
      case 'scheduled':
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Upcoming Auction
          </Badge>
        );
      case 'active':
        return (
          <Badge variant="default" className="flex items-center gap-1 bg-green-600">
            <Clock className="w-3 h-3" />
            Live Auction
          </Badge>
        );
      case 'ended':
        return (
          <Badge variant="outline" className="flex items-center gap-1 text-gray-600">
            <CheckCircle className="w-3 h-3" />
            Auction Ended
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Not Scheduled
          </Badge>
        );
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2">
        {getStatusBadge()}
      </div>
      
      {auctionTimingStatus === 'scheduled' && scheduleStartTime && (
        <div className="text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Starts: {formatUKDateTime(scheduleStartTime)}
          </div>
        </div>
      )}
      
      {auctionTimingStatus === 'active' && scheduleEndTime && (
        <div className="text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Ends: {formatUKDateTime(scheduleEndTime)}
          </div>
        </div>
      )}
      
      {auctionTimingStatus === 'ended' && scheduleEndTime && (
        <div className="text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Ended: {formatUKDateTime(scheduleEndTime)}
          </div>
        </div>
      )}
    </div>
  );
};
