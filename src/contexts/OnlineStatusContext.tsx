
import React, { createContext, useContext, PropsWithChildren } from "react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useToast } from "@/hooks/use-toast";

interface OnlineStatusContextType {
  isOnline: boolean;
}

const OnlineStatusContext = createContext<OnlineStatusContextType | undefined>(undefined);

export function OnlineStatusProvider({ children }: PropsWithChildren) {
  const isOnline = useOnlineStatus();
  const { toast } = useToast();

  // Show toast notification when online status changes
  React.useEffect(() => {
    if (isOnline) {
      toast({
        title: "You're back online",
        description: "Your connection has been restored. Syncing pending bids...",
      });
    } else {
      toast({
        title: "You're offline",
        description: "Bids will be queued and submitted when your connection returns.",
        variant: "destructive",
      });
    }
  }, [isOnline, toast]);

  return (
    <OnlineStatusContext.Provider value={{ isOnline }}>
      {children}
    </OnlineStatusContext.Provider>
  );
}

export function useOnlineStatusContext() {
  const context = useContext(OnlineStatusContext);
  if (context === undefined) {
    throw new Error("useOnlineStatusContext must be used within an OnlineStatusProvider");
  }
  return context;
}
