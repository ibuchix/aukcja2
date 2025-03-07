
import { useAuth } from "@/contexts/AuthContext";
import { useWelcomeDashboardData } from "@/hooks/useWelcomeDashboardData";
import { DashboardLayout } from "@/components/dealer/dashboard/DashboardLayout";
import { DealerWelcomeCard } from "@/components/dealer/dashboard/DealerWelcomeCard";
import { ProfileInfoSection } from "@/components/dealer/dashboard/ProfileInfoSection";
import { QuickActions } from "@/components/dealer/dashboard/QuickActions";
import { BusinessActionSection } from "@/components/dealer/dashboard/BusinessActionSection";
import { StatsSection } from "@/components/dealer/dashboard/StatsSection";
import { useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { LoadingDashboard } from "@/components/dealer/dashboard/LoadingDashboard";
import { supabase } from "@/integrations/supabase/client";

export default function DealerDashboard() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { 
    dealerProfile, 
    recentActivity, 
    profileDataLoading, 
    profileFetchAttempted,
    directQueryResult 
  } = useWelcomeDashboardData(user, isAuthLoading);
  const navigate = useNavigate();
  
  // Enhanced RLS debug logging
  useEffect(() => {
    const debugRls = async () => {
      if (user) {
        console.log("DealerDashboard - Current auth state:", { 
          userExists: !!user,
          userId: user.id,
          userEmail: user.email,
          dealerProfileExists: !!dealerProfile,
        });
        
        // Test direct query to verify RLS is working correctly
        try {
          const { data, error } = await supabase
            .from('dealers')
            .select('*')
            .eq('user_id', user.id)
            .single();
          
          console.log("Direct query test result:", { 
            success: !error, 
            hasData: !!data,
            error: error?.message 
          });
          
          // Verify JWT claim matches what RLS expects
          const { data: jwtData, error: jwtError } = await supabase
            .rpc('debug_auth_user_id');
          
          console.log("JWT Auth Claim Check:", {
            success: !jwtError,
            jwtUserId: jwtData,
            matchesCurrentUser: user.id === jwtData,
            error: jwtError?.message
          });
          
          // Check if session contains the correct headers
          const { data: { session } } = await supabase.auth.getSession();
          console.log("Session check:", {
            hasSession: !!session,
            hasAccessToken: !!session?.access_token,
            expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
            tokenType: session?.token_type
          });
        } catch (err) {
          console.error("Error in RLS debug queries:", err);
        }
      }
    };
    
    debugRls();
  }, [user, dealerProfile]);

  // Determine if we're still in a loading state
  const isLoading = isAuthLoading || profileDataLoading;

  // If we're not loading, the user exists, but no dealer profile was found
  const noProfileFound = !dealerProfile && !!user && !isLoading && profileFetchAttempted;

  // Show loading state
  if (isLoading) {
    return <LoadingDashboard />;
  }

  // Improve auth check to ensure we're only showing the dashboard to authenticated users
  if (!user && !isLoading) {
    return (
      <DashboardLayout title="Authentication Required">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>
            You need to be logged in to access the dealer dashboard.
          </AlertDescription>
        </Alert>
        <Button 
          onClick={() => navigate('/auth')}
          className="w-full md:w-auto"
        >
          Go to Login
        </Button>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Dealer Dashboard">
      {directQueryResult && (
        <Alert variant={directQueryResult.success ? "default" : "destructive"} className="mb-6">
          {directQueryResult.success ? 
            <CheckCircle2 className="h-4 w-4 text-green-500" /> : 
            <AlertCircle className="h-4 w-4" />
          }
          <AlertTitle>
            {directQueryResult.success ? "Direct Query Test Passed" : "Direct Query Test Failed"}
          </AlertTitle>
          <AlertDescription>
            {directQueryResult.message}
          </AlertDescription>
        </Alert>
      )}
      
      {noProfileFound ? (
        <div className="space-y-6">
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Profile Not Found</AlertTitle>
            <AlertDescription>
              We couldn't find your dealer profile. You may need to complete your registration.
            </AlertDescription>
          </Alert>
          <Button 
            onClick={() => navigate('/complete-registration')}
            className="w-full md:w-auto"
          >
            Complete Registration
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          <DealerWelcomeCard 
            dealerName={dealerProfile?.supervisor_name || user?.email?.split('@')[0] || "Dealer"}
            dealershipName={dealerProfile?.dealership_name || "Your Dealership"}
            isLoading={false}
          />
          
          <ProfileInfoSection 
            dealerProfile={dealerProfile}
            user={user}
            isLoading={false}
          />
          
          <QuickActions />
          
          <StatsSection recentActivity={recentActivity} />
          
          <BusinessActionSection />
        </div>
      )}
    </DashboardLayout>
  );
}
