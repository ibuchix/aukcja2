
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useAuthStateMonitor(setEmailVerified: (verified: boolean) => void) {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkExistingUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        console.log("Found existing session:", session.user.email);
        
        // Check if email is verified
        if (session.user.email_confirmed_at) {
          console.log("Email already verified, redirecting to dashboard");
          setEmailVerified(true);
          navigate('/dealer/dashboard');
          return;
        }
        
        // If not verified but has a session, we still need to wait for verification
        setEmailVerified(false);
        
        // Query profile without role column (role is in user_roles table)
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, suspended, updated_at')
          .eq('id', session.user.id)
          .single();
        
        const { data: dealer } = await supabase
          .from('dealers')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (profile && !dealer) {
          toast({
            title: "Profile Recovery Required",
            description: "We found your account but need to complete your dealer profile. Please fill out the form.",
            variant: "default",
          });
        }
      }
    };

    checkExistingUser();
  }, [toast, navigate, setEmailVerified]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event, session?.user?.email_confirmed_at);
      
      if (event === 'SIGNED_IN' && session?.user?.email_confirmed_at) {
        setEmailVerified(true);
        navigate('/dealer/dashboard');
      }
      else if (event === 'USER_UPDATED') {
        console.log("User updated, email confirmed:", session?.user?.email_confirmed_at !== null);
        setEmailVerified(session?.user?.email_confirmed_at !== null);
        
        // If email is now verified, redirect to dashboard
        if (session?.user?.email_confirmed_at) {
          navigate('/dealer/dashboard');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, setEmailVerified]);
}
