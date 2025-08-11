
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DealerLoginForm } from "@/components/auth/DealerLoginForm";
import { DealerSignupForm } from "@/pages/auth/DealerSignupForm";

export function AuthTabs({ returnUrl = "/dealer/dashboard" }: { returnUrl?: string }) {
  const [activeTab, setActiveTab] = useState("login");

  // Function to handle registration completion
  const handleRegistrationComplete = () => {
    console.log("Registration completed, switching to login tab");
    setActiveTab("login");
  };

  return (
    <Tabs value={activeTab} className="w-full max-w-md" onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="login">Zaloguj się</TabsTrigger>
        <TabsTrigger value="register">Zarejestruj się</TabsTrigger>
      </TabsList>
      <TabsContent value="login">
        <div className="space-y-4 p-6 bg-card rounded-md shadow">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Zaloguj się</h1>
          </div>
          <DealerLoginForm returnUrl={returnUrl} />
        </div>
      </TabsContent>
      <TabsContent value="register">
        <div className="space-y-4 p-6 bg-card rounded-md shadow">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Rejestracja</h1>
          </div>
          <DealerSignupForm onRegistrationComplete={handleRegistrationComplete} />
        </div>
      </TabsContent>
    </Tabs>
  );
}
