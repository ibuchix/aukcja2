
import { Clock, Calendar, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AuctionScheduleInfoProps {
  scheduleStatus?: string;
  scheduleStartTime?: string;
  scheduleEndTime?: string;
  auctionTimingStatus?: 'scheduled' | 'running' | 'ended' | 'unknown';
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
            Scheduled
          </Badge>
        );
      case 'running':
        return (
          <Badge variant="default" className="flex items-center gap-1 bg-green-600">
            <Clock className="w-3 h-3" />
            Live Auction
          </Badge>
        );
      case 'ended':
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Ended
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

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'TBD';
    return new Date(dateString).toLocaleString();
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
            Starts: {formatDateTime(scheduleStartTime)}
          </div>
        </div>
      )}
      
      {auctionTimingStatus === 'running' && scheduleEndTime && (
        <div className="text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Ends: {formatDateTime(scheduleEndTime)}
          </div>
        </div>
      )}
      
      {auctionTimingStatus === 'ended' && scheduleEndTime && (
        <div className="text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Ended: {formatDateTime(scheduleEndTime)}
          </div>
        </div>
      )}
    </div>
  );
};
