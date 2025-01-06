import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { DealerSignupForm } from "@/components/auth/DealerSignupForm";

const AuthPage = () => {
  const navigate = useNavigate();
  const [isDealer, setIsDealer] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN") {
        navigate("/dealer/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center mb-6 font-heading">Dealer Portal</h1>
        
        <div className="mb-6">
          <Button
            onClick={() => setIsDealer(false)}
            variant={!isDealer ? "default" : "outline"}
            className="mr-2"
          >
            Login
          </Button>
          <Button
            onClick={() => setIsDealer(true)}
            variant={isDealer ? "default" : "outline"}
          >
            Dealer Sign Up
          </Button>
        </div>

        {!isDealer ? (
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            providers={[]}
            theme="light"
          />
        ) : (
          <DealerSignupForm />
        )}
      </div>
    </div>
  );
};

export default AuthPage;