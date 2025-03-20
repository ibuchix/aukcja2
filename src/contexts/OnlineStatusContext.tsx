
import React, { createContext, useContext, PropsWithChildren, useState, useEffect } from "react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useToast } from "@/hooks/use-toast";

interface OnlineStatusContextType {
  isOnline: boolean;
}

const OnlineStatusContext = createContext<OnlineStatusContextType | undefined>(undefined);

export function OnlineStatusProvider({ children }: PropsWithChildren) {
  const isOnline = useOnlineStatus();
  const { toast } = useToast();
  const [prevOnlineStatus, setPrevOnlineStatus] = useState<boolean | null>(null);

  // Show toast notification only when online status changes
  useEffect(() => {
    // Skip the initial render
    if (prevOnlineStatus === null) {
      setPrevOnlineStatus(isOnline);
      return;
    }

    // Only show notification when status actually changes
    if (prevOnlineStatus !== isOnline) {
      if (isOnline) {
        toast({
          title: "You're back online",
          description: "Your connection has been restored.",
        });
      } else {
        toast({
          title: "You're offline",
          description: "Don't worry, proxy bids will still be processed when connectivity returns.",
          variant: "destructive",
        });
      }
      
      setPrevOnlineStatus(isOnline);
    }
  }, [isOnline, toast, prevOnlineStatus]);

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
