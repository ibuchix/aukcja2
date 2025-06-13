
import { useState, useRef, useEffect } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { fetchDealerProfile } from "../authUtils";
import { AuthDebugger } from "@/utils/authDebugger";

/**
 * Simplified hook to initialize authentication state with WebSocket failure handling
 */
export function useAuthInitializer() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [initializationComplete, setInitializationComplete] = useState<boolean>(false);
  const isInitializedRef = useRef(false);
  const { toast } = useToast();

  useEffect(() => {
    const initializeAuth = async () => {
      if (isInitializedRef.current) return;
      
      try {
        console.log("Starting auth initialization with WebSocket fallback");
        setIsLoading(true);
        isInitializedRef.current = true;
        
        // Debug auth state at initialization
        await AuthDebugger.captureAuthState("Auth Initialization Start").catch(() => {
          console.log("Debug capture failed, continuing with auth init");
        });
        
        // Get current session with error handling for WebSocket issues
        let sessionData;
        try {
          const { data, error } = await supabase.auth.getSession();
          sessionData = { data, error };
        } catch (sessionError) {
          console.warn("Session retrieval failed, possibly due to WebSocket issues:", sessionError);
          // Try to continue with fallback
          sessionData = { data: { session: null }, error: sessionError };
        }
        
        if (sessionData.error && !sessionData.error.message.includes("WebSocket")) {
          console.error("Non-WebSocket error getting session:", sessionData.error);
          await AuthDebugger.captureAuthState("Auth Initialization Error").catch(() => {});
          setIsLoading(false);
          setInitializationComplete(true);
          return;
        }
        
        if (sessionData.data?.session) {
          console.log("Existing session found during initialization");
          await AuthDebugger.captureAuthState("Session Found").catch(() => {});
          
          // Set session and user immediately
          setSession(sessionData.data.session);
          setUser(sessionData.data.session.user);
          
          // Fetch profile after session is established, with error handling
          if (sessionData.data.session.user) {
            try {
              // Small delay to ensure auth context propagates
              await new Promise(resolve => setTimeout(resolve, 100));
              
              const profileData = await fetchDealerProfile(sessionData.data.session.user.id);
              setProfile(profileData);
              await AuthDebugger.captureAuthState("Profile Loaded Successfully").catch(() => {});
            } catch (profileError) {
              console.error("Error fetching profile during init:", profileError);
              await AuthDebugger.captureAuthState("Profile Load Error").catch(() => {});
              // Continue without profile - don't block auth
            }
          }
        } else {
          console.log("No existing session found during initialization");
          await AuthDebugger.captureAuthState("No Session Found").catch(() => {});
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        await AuthDebugger.captureAuthState("Auth Initialization Exception").catch(() => {});
        
        // Don't let WebSocket errors block the app
        if (error instanceof Error && error.message.includes("WebSocket")) {
          console.log("WebSocket error during auth init, continuing anyway");
        }
      } finally {
        setIsLoading(false);
        setInitializationComplete(true);
      }
    };

    // Initialize immediately
    initializeAuth();
    
    // Reduced safety timeout since we want faster loading
    const safetyTimeout = setTimeout(() => {
      if (isLoading) {
        console.warn("Auth initialization safety timeout triggered - completing initialization");
        setIsLoading(false);
        setInitializationComplete(true);
      }
    }, 3000); // Reduced from 5 seconds
    
    return () => {
      clearTimeout(safetyTimeout);
    };
  }, []);

  return {
    session,
    user,
    profile,
    isLoading,
    initializationComplete,
    setSession,
    setUser,
    setProfile,
    setIsLoading
  };
}
