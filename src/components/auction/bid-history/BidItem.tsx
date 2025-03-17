
import { format } from "date-fns";
import { User, Bot, Check, AlertCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Bid } from "./types";

interface BidItemProps {
  bid: Bid;
}

export const BidItem = ({ bid }: BidItemProps) => {
  const getBidStatusIcon = (bid: Bid) => {
    switch (bid.status) {
      case "active":
        return <Check size={16} className="text-green-500" />;
      case "outbid":
        return <AlertCircle size={16} className="text-amber-500" />;
      default:
        return <Clock size={16} className="text-blue-500" />;
    }
  };

  return (
    <div className="flex items-start gap-2 p-2 border-b">
      <div className="bg-muted p-2 rounded-full">
        {bid.is_proxy ? <Bot size={16} /> : <User size={16} />}
      </div>
      <div className="flex-1">
        <div className="flex justify-between">
          <span className="font-medium">{bid.dealer_name}</span>
          <span className="text-sm text-muted-foreground">
            {format(new Date(bid.created_at), "MMM d, HH:mm")}
          </span>
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-primary font-semibold">
            ${bid.amount.toLocaleString()}
          </span>
          <div className="flex items-center space-x-2">
            {getBidStatusIcon(bid)}
            <Badge variant={bid.is_proxy ? "outline" : "secondary"} className="text-xs">
              {bid.is_proxy ? "Auto" : "Manual"}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
};
