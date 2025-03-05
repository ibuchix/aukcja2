
import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { DealerSignupForm } from "@/pages/auth/DealerSignupForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DealerLoginForm } from "@/components/auth/DealerLoginForm";

const Auth = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Get the active tab from URL query parameter, default to "register" if not present
  const tabFromUrl = searchParams.get("tab");
  const initialTab = (tabFromUrl === "login" || tabFromUrl === "register") 
    ? tabFromUrl 
    : "register";
  
  const [activeTab, setActiveTab] = useState<"register" | "login">(initialTab as "register" | "login");

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    const newTab = value as "register" | "login";
    setActiveTab(newTab);
    
    // Update the URL with new tab parameter
    searchParams.set("tab", newTab);
    setSearchParams(searchParams);
  };

  return (
    <div className="container relative h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
        <div className="absolute inset-0 bg-[#DC143C]" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <Link to="/">
            <img 
              src="/lovable-uploads/2960eac5-04b8-4f16-9cd3-2cfdeeda3e72.png" 
              alt="Auto-Strada Logo" 
              className="h-12"
            />
          </Link>
        </div>
        <div className="relative z-20 flex-1 flex items-center justify-center">
          <blockquote className="text-center">
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
              <CardTitle className="font-oswald text-[#DC143C]">Dealer Portal</CardTitle>
              <CardDescription className="font-kanit">
                Register or login to your dealer account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={handleTabChange}>
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="register">Register</TabsTrigger>
                  <TabsTrigger value="login">Login</TabsTrigger>
                </TabsList>
                <TabsContent value="register">
                  <DealerSignupForm />
                </TabsContent>
                <TabsContent value="login">
                  <DealerLoginForm />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;
