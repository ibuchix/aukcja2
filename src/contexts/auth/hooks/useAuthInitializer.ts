
import { useState, useRef, useEffect } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { fetchDealerProfile } from "../authUtils";
import { AuthDebugger } from "@/utils/authDebugger";

/**
 * Simplified hook to initialize authentication state with better timing
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
        console.log("Starting simplified auth initialization");
        setIsLoading(true);
        isInitializedRef.current = true;
        
        // Debug auth state at initialization
        await AuthDebugger.captureAuthState("Auth Initialization Start");
        
        // Get current session without complex retry logic
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting session:", error);
          await AuthDebugger.captureAuthState("Auth Initialization Error");
          setIsLoading(false);
          setInitializationComplete(true);
          return;
        }
        
        if (data?.session) {
          console.log("Existing session found");
          await AuthDebugger.captureAuthState("Session Found");
          
          // Set session and user immediately
          setSession(data.session);
          setUser(data.session.user);
          
          // Fetch profile after session is established
          if (data.session.user) {
            try {
              // Small delay to ensure auth context propagates to database
              await new Promise(resolve => setTimeout(resolve, 100));
              
              const profileData = await fetchDealerProfile(data.session.user.id);
              setProfile(profileData);
              await AuthDebugger.captureAuthState("Profile Loaded Successfully");
            } catch (profileError) {
              console.error("Error fetching profile:", profileError);
              await AuthDebugger.captureAuthState("Profile Load Error");
              // Continue without profile - don't block auth
            }
          }
        } else {
          console.log("No existing session found");
          await AuthDebugger.captureAuthState("No Session Found");
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        await AuthDebugger.captureAuthState("Auth Initialization Exception");
      } finally {
        setIsLoading(false);
        setInitializationComplete(true);
      }
    };

    // Initialize immediately without artificial delays
    initializeAuth();
    
    // Set a single safety timeout to prevent endless loading - increased to 5 seconds
    const safetyTimeout = setTimeout(() => {
      if (isLoading) {
        console.warn("Auth initialization safety timeout triggered - completing initialization");
        setIsLoading(false);
        setInitializationComplete(true);
      }
    }, 5000);
    
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
