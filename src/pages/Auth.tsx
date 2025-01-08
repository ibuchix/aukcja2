import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { DealerSignupForm } from "@/components/auth/DealerSignupForm";
import { House } from "@phosphor-icons/react";

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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold font-heading">Dealer Portal</h1>
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-primary hover:text-primary/90"
          >
            <House size={20} weight="bold" />
            Back to Home
          </Button>
        </div>
        
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
            redirectTo={`${window.location.origin}/dealer/dashboard`}
          />
        ) : (
          <DealerSignupForm />
        )}
      </div>
    </div>
  );
};

export default AuthPage;