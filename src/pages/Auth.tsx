import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DealerSignupForm } from "@/components/auth/DealerSignupForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Auth = () => {
  useEffect(() => {
    const checkDealers = async () => {
      const { data: dealers, error } = await supabase
        .from('dealers')
        .select('*');

      if (error) {
        console.error('Error fetching dealers:', error);
      } else {
        console.log('Current dealers in database:', dealers);
      }
    };

    checkDealers();
  }, []);

  return (
    <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
        <div className="absolute inset-0 bg-[#DC143C]" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <img src="/placeholder.svg" alt="Logo" className="mr-2 h-6 w-6" />
          Auto-Strada
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              Join our network of trusted dealers and expand your reach in the automotive market.
            </p>
          </blockquote>
        </div>
      </div>
      <div className="p-4 lg:p-8 h-full flex items-center">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <Card>
            <CardHeader>
              <CardTitle>Dealer Registration</CardTitle>
              <CardDescription>
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