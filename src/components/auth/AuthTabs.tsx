
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DealerLoginForm } from "@/components/auth/DealerLoginForm";
import { DealerSignupForm } from "@/pages/auth/DealerSignupForm";
import { useSearchParams, useNavigate } from "react-router-dom";

export function AuthTabs({ returnUrl = "/dealer/dashboard" }: { returnUrl?: string }) {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "login";
  const [activeTab, setActiveTab] = useState(initialTab);
  const navigate = useNavigate();

  // Function to handle registration completion
  const handleRegistrationComplete = () => {
    console.log("Registration completed, switching to login tab");
    setActiveTab("login");
    // Update URL without page reload
    navigate("/auth?tab=login", { replace: true });
  };

  // Update tab when URL params change
  useEffect(() => {
    const tab = searchParams.get("tab") || "login";
    setActiveTab(tab);
  }, [searchParams]);

  return (
    <Tabs value={activeTab} className="w-full max-w-md" onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="login">Login</TabsTrigger>
        <TabsTrigger value="register">Register</TabsTrigger>
      </TabsList>
      <TabsContent value="login">
        <div className="space-y-4 p-6 bg-card rounded-md shadow">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Dealer Login</h1>
            <p className="text-sm text-muted-foreground">Enter your credentials to access your dealer account</p>
          </div>
          <DealerLoginForm returnUrl={returnUrl} />
        </div>
      </TabsContent>
      <TabsContent value="register">
        <div className="space-y-4 p-6 bg-card rounded-md shadow">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Dealer Registration</h1>
            <p className="text-sm text-muted-foreground">Create your dealer account to access the platform</p>
          </div>
          <DealerSignupForm onRegistrationComplete={handleRegistrationComplete} />
        </div>
      </TabsContent>
    </Tabs>
  );
}
