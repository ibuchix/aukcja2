import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DealerSignupForm } from "@/components/auth/DealerSignupForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Auth = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        navigate('/dealer/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="container relative h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
        <div className="absolute inset-0 bg-[#DC143C]" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <img src="/lovable-uploads/77d4932b-acbe-4d45-8b3e-ba3304cf4491.png" alt="Logo" className="h-8" />
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              Join our network of trusted dealers and expand your business reach.
            </p>
          </blockquote>
        </div>
      </div>
      <div className="p-4 lg:p-8 h-full flex items-center">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <Card>
            <CardHeader>
              <CardTitle className="font-oswald text-[#DC143C]">Dealer Registration</CardTitle>
              <CardDescription className="font-kanit">
                Register your dealership to start bidding on vehicles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DealerSignupForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;