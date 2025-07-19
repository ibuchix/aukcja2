
import { Badge } from "@/components/ui/badge";
import { Clock, Play, StopCircle, CheckCircle } from "lucide-react";
import { formatUKDateTime } from "@/utils/ukTimeUtils";

interface AuctionStatusIndicatorProps {
  auctionTimingStatus: 'scheduled' | 'active' | 'ended' | 'unknown';
  scheduleStartTime?: string;
  scheduleEndTime?: string;
  auctionStatus?: string;
}

export const AuctionStatusIndicator = ({
  auctionTimingStatus,
  scheduleStartTime,
  scheduleEndTime,
  auctionStatus
}: AuctionStatusIndicatorProps) => {
  const getStatusConfig = () => {
    switch (auctionTimingStatus) {
      case 'scheduled':
        return {
          variant: 'secondary' as const,
          icon: <Clock className="h-3 w-3" />,
          text: 'Scheduled',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50'
        };
      case 'active':
        return {
          variant: 'default' as const,
          icon: <Play className="h-3 w-3" />,
          text: 'Live',
          color: 'text-green-600',
          bgColor: 'bg-green-50'
        };
      case 'ended':
        const isSold = auctionStatus === 'sold';
        return {
          variant: 'outline' as const,
          icon: isSold ? <CheckCircle className="h-3 w-3" /> : <StopCircle className="h-3 w-3" />,
          text: isSold ? 'Sold' : 'Ended',
          color: isSold ? 'text-green-600' : 'text-gray-600',
          bgColor: isSold ? 'bg-green-50' : 'bg-gray-50'
        };
      default:
        return {
          variant: 'secondary' as const,
          icon: <Clock className="h-3 w-3" />,
          text: 'Unknown',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="space-y-1">
      <Badge variant={config.variant} className={`${config.bgColor} ${config.color} flex items-center gap-1`}>
        {config.icon}
        {config.text}
      </Badge>
      
      {auctionTimingStatus === 'scheduled' && scheduleStartTime && (
        <p className="text-xs text-gray-500">
          Starts: {formatUKDateTime(scheduleStartTime)}
        </p>
      )}
      
      {auctionTimingStatus === 'active' && scheduleEndTime && (
        <p className="text-xs text-gray-500">
          Ends: {formatUKDateTime(scheduleEndTime)}
        </p>
      )}
      
      {auctionTimingStatus === 'ended' && scheduleEndTime && (
        <p className="text-xs text-gray-500">
          Ended: {formatUKDateTime(scheduleEndTime)}
        </p>
      )}
    </div>
  );
};
