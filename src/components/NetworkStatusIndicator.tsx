
import { Wifi, WifiOff } from "lucide-react";
import { useOnlineStatusContext } from "@/contexts/OnlineStatusContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function NetworkStatusIndicator() {
  const { isOnline } = useOnlineStatusContext();
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center">
            {isOnline ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-yellow-500 animate-pulse" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {isOnline 
            ? "You are online. Bids will be processed immediately." 
            : "You are offline. Bids will be queued and processed when your connection returns."}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
