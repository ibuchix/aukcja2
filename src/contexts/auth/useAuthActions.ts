
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { signOutUser, refreshUserSession, fetchDealerProfile } from "./authUtils";

export function useAuthActions(
  setIsLoading: (loading: boolean) => void,
  setUser: (user: any) => void,
  setSession: (session: any) => void,
  setProfile: (profile: any) => void
) {
  const navigate = useNavigate();
  const { toast } = useToast();

  const signOut = async () => {
    try {
      setIsLoading(true);
      const { success, error } = await signOutUser();
      
      if (!success && error) {
        toast({
          title: "Sign out failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      
      setUser(null);
      setSession(null);
      setProfile(null);
      
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account.",
      });
      
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSession = async () => {
    try {
      setIsLoading(true);
      const { success, session: newSession, user: newUser, error } = await refreshUserSession();
      
      if (!success || error) {
        console.error("Session refresh error:", error);
        return;
      }
      
      if (newSession) {
        console.log("Session refreshed successfully");
        setSession(newSession);
        setUser(newUser ?? null);
        
        if (newUser) {
          const profileData = await fetchDealerProfile(newUser.id);
          setProfile(profileData);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return { signOut, refreshSession };
}
