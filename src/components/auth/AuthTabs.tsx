import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DealerLoginForm } from "@/components/auth/DealerLoginForm";
import { DealerSignupForm } from "@/pages/auth/DealerSignupForm";
import { Button } from "@/components/ui/button";
import { TestAccountUtil } from "@/components/auth/TestAccountUtil";
import { AuthTroubleshooter } from "@/components/auth/AuthTroubleshooter";
import { ClearAuthStateButton } from "@/components/auth/ClearAuthStateButton";

interface AuthTabsProps {
  returnUrl: string;
}

export function AuthTabs({ returnUrl }: AuthTabsProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loginFailed, setLoginFailed] = useState(false);
  const [showTestUtility, setShowTestUtility] = useState(false);
  
  const tabFromUrl = searchParams.get("tab");
  // Keep the current tab as is when login fails
  const initialTab = loginFailed ? "login" : 
    (tabFromUrl === "login" || tabFromUrl === "register") ? tabFromUrl : "register";
  
  const [activeTab, setActiveTab] = useState<"register" | "login">(initialTab as "register" | "login");

  // This function handles tab changes while preventing automatic switching on login failure
  const handleTabChange = (value: string) => {
    // If we're coming from a failed login attempt, clear that state
    if (loginFailed && value === "register") {
      setLoginFailed(false);
    }
    
    const newTab = value as "register" | "login";
    setActiveTab(newTab);
    
    // Update URL to reflect current tab
    const newParams = new URLSearchParams(searchParams);
    newParams.set("tab", newTab);
    setSearchParams(newParams, { replace: true });
  };

  // Handle login result to prevent tab switching on failed login
  const handleLoginResult = (failed: boolean) => {
    console.log("Login result:", failed ? "failed" : "success");
    setLoginFailed(failed);
    
    // If failed, ensure we stay on login tab
    if (failed && activeTab !== "login") {
      setActiveTab("login");
      const newParams = new URLSearchParams(searchParams);
      newParams.set("tab", "login");
      setSearchParams(newParams, { replace: true });
    }
  };
  
  if (showTestUtility) {
    return (
      <>
        <TestAccountUtil />
        <Button 
          variant="outline" 
          onClick={() => setShowTestUtility(false)} 
          className="w-full mt-4"
        >
          Back to Login/Register
        </Button>
      </>
    );
  }

  return (
    <>
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="register">Register</TabsTrigger>
          <TabsTrigger value="login">Login</TabsTrigger>
        </TabsList>
        <TabsContent value="register">
          <DealerSignupForm />
        </TabsContent>
        <TabsContent value="login">
          <DealerLoginForm returnUrl={returnUrl} />
        </TabsContent>
      </Tabs>
      
      {/* Add test account utility button */}
      <div className="mt-6 text-center">
        <Button 
          variant="outline" 
          onClick={() => setShowTestUtility(true)} 
          className="text-sm"
        >
          Create Test Account
        </Button>
      </div>
      
      {/* Enhanced authentication troubleshooting section */}
      <div className="mt-6 border-t pt-4 border-gray-100">
        <p className="text-xs text-muted-foreground mb-2 text-center">
          Having trouble logging in?
        </p>
        <div className="flex flex-col items-center gap-2">
          <ClearAuthStateButton />
          <button 
            onClick={() => window.location.reload()}
            className="text-xs text-muted-foreground hover:text-primary underline"
          >
            Refresh page
          </button>
          <button
            onClick={() => {
              // Force sign out and clear auth state
              const clearBtn = document.querySelector('button[class*="ClearAuthStateButton"]') as HTMLButtonElement;
              if (clearBtn) {
                clearBtn.click();
              } else {
                // Fallback - add force_login and reload
                const newParams = new URLSearchParams(searchParams);
                newParams.set("force_login", "true");
                newParams.set("tab", "login");
                window.location.href = `/auth?${newParams.toString()}`;
              }
            }}
            className="text-xs text-muted-foreground hover:text-primary underline"
          >
            Force login form
          </button>
        </div>
      </div>
    </>
  );
}
