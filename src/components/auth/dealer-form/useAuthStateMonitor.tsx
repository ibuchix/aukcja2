
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
        // Use direct string literals instead of helper functions
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
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
  }, [toast]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event, session?.user?.email_confirmed_at);
      if (event === 'SIGNED_IN' && session?.user?.email_confirmed_at) {
        setEmailVerified(true);
        navigate('/dealer/dashboard');
      }
      if (event === 'USER_UPDATED') {
        setEmailVerified(session?.user?.email_confirmed_at !== null);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, setEmailVerified]);
}
