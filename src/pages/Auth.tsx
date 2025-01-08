import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { DealerSignupForm } from "@/components/auth/DealerSignupForm";
import { House } from "@phosphor-icons/react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthError, AuthApiError } from "@supabase/supabase-js";

const AuthPage = () => {
  const navigate = useNavigate();
  const [isDealer, setIsDealer] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const getErrorMessage = (error: AuthError) => {
    if (error instanceof AuthApiError) {
      // First check the error code from the response body
      const errorBody = error.message.includes('{') ? JSON.parse(error.message) : null;
      if (errorBody?.code === "invalid_credentials") {
        return "Invalid email or password. Please check your credentials and try again.";
      }

      // Then check status codes
      switch (error.status) {
        case 400:
          return "Invalid login attempt. Please check your credentials and try again.";
        case 422:
          return "Invalid email format. Please enter a valid email address.";
        case 429:
          return "Too many login attempts. Please try again later.";
      }
    }
    return error.message;
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        navigate("/dealer/dashboard");
      }
      if (event === "USER_UPDATED") {
        const { error } = await supabase.auth.getSession();
        if (error) {
          console.error("Auth error:", error);
          setErrorMessage(getErrorMessage(error));
        }
      }
      if (event === "SIGNED_OUT") {
        setErrorMessage("");
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

        {errorMessage && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        
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