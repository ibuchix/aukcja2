
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
import { TestAccountUtil } from "@/components/auth/TestAccountUtil";
import { Button } from "@/components/ui/button";

const Auth = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const returnUrl = location.state?.returnUrl || "/dealer/dashboard";
  
  // Use ref to prevent immediate redirect checks
  const initialLoadCompleted = useRef(false);
  const redirectAttemptedRef = useRef(false);
  
  // Significantly increase the auth check delay to ensure form is fully loaded
  const [authCheckDelay, setAuthCheckDelay] = useState(true);
  
  const [authContext, authError] = (() => {
    try {
      const ctx = useAuth();
      return [ctx, null];
    } catch (error) {
      console.error("Auth context error:", error);
      return [{ isAuthenticated: false, isLoading: false, isInitialized: false }, error];
    }
  })();
  
  const { isAuthenticated, isLoading, isInitialized } = authContext;
  const [redirectAttempted, setRedirectAttempted] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [loginFailed, setLoginFailed] = useState(false);
  const [showTestUtility, setShowTestUtility] = useState(false);
  
  const tabFromUrl = searchParams.get("tab");
  // Keep the current tab as is when login fails
  const initialTab = loginFailed ? "login" : 
    (tabFromUrl === "login" || tabFromUrl === "register") ? tabFromUrl : "register";
  
  const [activeTab, setActiveTab] = useState<"register" | "login">(initialTab as "register" | "login");

  // Add significant delay before checking auth to allow form interaction
  useEffect(() => {
    console.log("Setting up auth check delay");
    const timer = setTimeout(() => {
      console.log("Auth check delay completed");
      setAuthCheckDelay(false);
      initialLoadCompleted.current = true;
    }, 3000); // Increased to 3 seconds to ensure form load
    
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

  // Force URL parameter-based override to prevent redirect
  const forceShowLogin = searchParams.has("force_login");

  // Modified to prevent immediate redirect with multiple safeguards
  useEffect(() => {
    // Skip if any of these conditions are true
    if (!isInitialized || 
        !initialLoadCompleted.current || 
        authCheckDelay || 
        redirectAttemptedRef.current || 
        forceShowLogin) {
      return;
    }
    
    // Only proceed with redirect if fully authenticated and initialization is complete
    if (isAuthenticated && !isLoading) {
      console.log("Auth initialization complete, user authenticated, redirecting to:", returnUrl);
      redirectAttemptedRef.current = true;
      setRedirectAttempted(true);
      
      // Add small delay before navigation to prevent immediate jumps
      setTimeout(() => {
        navigate(returnUrl);
      }, 100);
    } else if (isInitialized && !isLoading && !isAuthenticated) {
      console.log("Auth initialization complete, no authenticated user found");
    }
  }, [isAuthenticated, isLoading, isInitialized, navigate, redirectAttempted, returnUrl, authCheckDelay, forceShowLogin]);

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

  // Show pre-initialization loading state
  if (!isInitialized && authCheckDelay) {
    return (
      <div className="container flex flex-col items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <div className="text-muted-foreground">Initializing authentication system...</div>
        <div className="text-xs text-muted-foreground mt-2">This may take a moment</div>
      </div>
    );
  }

  // Show loading indicator during the initial authentication check
  if ((isLoading || authCheckDelay) && !forceShowLogin) {
    return (
      <div className="container flex flex-col items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <div className="text-muted-foreground">Preparing login form...</div>
        
        {loadingTimeout && (
          <div className="mt-8 p-4 border border-yellow-200 bg-yellow-50 rounded-md max-w-md">
            <h3 className="font-medium text-yellow-800">Taking longer than expected</h3>
            <p className="text-sm text-yellow-700 mt-1">
              Authentication is taking longer than usual. You can try refreshing the page
              or clearing your authentication state.
            </p>
            <div className="flex flex-col gap-2 mt-2">
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 text-sm rounded-md transition-colors"
              >
                Refresh Page
              </button>
              <ClearAuthStateButton />
              <button
                onClick={() => {
                  // Add force_login parameter and reload
                  const newParams = new URLSearchParams(searchParams);
                  newParams.set("force_login", "true");
                  newParams.set("tab", "login");
                  window.location.href = `/auth?${newParams.toString()}`;
                }}
                className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 text-sm rounded-md transition-colors"
              >
                Force Login Form
              </button>
            </div>
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
          <div className="flex flex-col gap-2 mt-2">
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 text-sm rounded-md transition-colors"
            >
              Refresh Page
            </button>
            <ClearAuthStateButton />
          </div>
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
              
              {showTestUtility ? (
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
              ) : (
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
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;
