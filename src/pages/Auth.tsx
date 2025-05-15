
import { useState, useEffect, useRef } from "react";
import { Link, useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { DealerSignupForm } from "@/pages/auth/DealerSignupForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DealerLoginForm } from "@/components/auth/DealerLoginForm";
import { SessionExpiredNotice } from "@/components/auth/SessionExpiredNotice";
import { ClearAuthStateButton } from "@/components/auth/ClearAuthStateButton";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

const Auth = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const returnUrl = location.state?.returnUrl || "/dealer/dashboard";
  
  // Use ref to prevent immediate redirect checks
  const initialLoadCompleted = useRef(false);
  const [authCheckDelay, setAuthCheckDelay] = useState(true);
  
  const [authContext, authError] = (() => {
    try {
      const ctx = useAuth();
      return [ctx, null];
    } catch (error) {
      console.error("Auth context error:", error);
      return [{ isAuthenticated: false, isLoading: false }, error];
    }
  })();
  
  const { isAuthenticated, isLoading } = authContext;
  const [redirectAttempted, setRedirectAttempted] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [loginFailed, setLoginFailed] = useState(false);
  
  const tabFromUrl = searchParams.get("tab");
  // Keep the current tab as is when login fails
  const initialTab = loginFailed ? "login" : 
    (tabFromUrl === "login" || tabFromUrl === "register") ? tabFromUrl : "register";
  
  const [activeTab, setActiveTab] = useState<"register" | "login">(initialTab as "register" | "login");

  // Add delay before checking auth to allow form interaction
  useEffect(() => {
    const timer = setTimeout(() => {
      setAuthCheckDelay(false);
      initialLoadCompleted.current = true;
    }, 1500); // Give 1.5 second before checking auth
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setLoadingTimeout(true);
      }, 10000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isLoading]);

  // Modified to prevent immediate redirect
  useEffect(() => {
    if (isAuthenticated && !isLoading && !redirectAttempted && !authCheckDelay && initialLoadCompleted.current) {
      console.log("User already logged in, redirecting to:", returnUrl);
      setRedirectAttempted(true);
      navigate(returnUrl);
    }
  }, [isAuthenticated, isLoading, navigate, redirectAttempted, returnUrl, authCheckDelay]);

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

  // Show loading indicator during the initial authentication check
  if (isLoading && authCheckDelay) {
    return (
      <div className="container flex flex-col items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <div className="text-muted-foreground">Preparing login form...</div>
      </div>
    );
  }

  if (isLoading && !authCheckDelay) {
    return (
      <div className="container flex flex-col items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <div className="text-muted-foreground">Loading authentication status...</div>
        
        {loadingTimeout && (
          <div className="mt-8 p-4 border border-yellow-200 bg-yellow-50 rounded-md max-w-md">
            <h3 className="font-medium text-yellow-800">Taking longer than expected</h3>
            <p className="text-sm text-yellow-700 mt-1">
              Authentication is taking longer than usual. You can try refreshing the page
              or checking your network connection.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-2 px-4 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 text-sm rounded-md transition-colors"
            >
              Refresh Page
            </button>
          </div>
        )}
      </div>
    );
  }

  if (authError) {
    return (
      <div className="container flex items-center justify-center h-screen">
        <div className="p-4 border border-red-200 bg-red-50 rounded-md max-w-md">
          <h3 className="font-medium text-red-800">Authentication Error</h3>
          <p className="text-sm text-red-700 mt-1">
            There was a problem initializing the authentication system. Please try refreshing the page.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 text-sm rounded-md transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container relative h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
        <div className="absolute inset-0 bg-[#DC143C]" />
        <div className="relative z-20 flex items-center justify-center text-lg font-medium w-full">
          <Link to="/">
            <img 
              src="/lovable-uploads/2960eac5-04b8-4f16-9cd3-2cfdeeda3e72.png" 
              alt="Auto-Strada Logo" 
              className="h-12"
            />
          </Link>
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
              <SessionExpiredNotice />
              
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
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;
