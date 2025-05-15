
import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

type SessionContextType = {
  session: any | null;
  isLoading: boolean;
  refreshSession: () => Promise<void>;
};

const SessionContext = createContext<SessionContextType>({
  session: null,
  isLoading: true,
  refreshSession: async () => {},
});

export const useSession = () => useContext(SessionContext);

export const SessionProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize session
    const getInitialSession = async () => {
      setIsLoading(true);
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setIsLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const refreshSession = async () => {
    setIsLoading(true);
    const { data } = await supabase.auth.getSession();
    setSession(data.session);
    setIsLoading(false);
  };

  return (
    <SessionContext.Provider value={{ session, isLoading, refreshSession }}>
      {children}
    </SessionContext.Provider>
  );
};
