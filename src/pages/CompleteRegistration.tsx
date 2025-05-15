
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { DealerProfileCompletion } from "@/components/auth/DealerProfileCompletion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Loader } from "@/components/ui/loader";

export default function CompleteRegistration() {
  const { user, isLoading, session } = useAuth();
  const navigate = useNavigate();

  // If user is already fully registered, redirect to dashboard
  useEffect(() => {
    if (!isLoading && user && !user.user_metadata?.needs_profile_completion) {
      navigate("/dealer/dashboard");
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return <Loader />;
  }

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication Error</AlertTitle>
          <AlertDescription>
            You must be logged in to complete your registration.
            <div className="mt-4">
              <button
                onClick={() => navigate("/auth")}
                className="px-4 py-2 bg-primary text-white rounded-md"
              >
                Go to Login
              </button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4 md:px-6 lg:px-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-8 text-center">Complete Your Profile</h1>
      <DealerProfileCompletion userId={user.id} email={user.email || ''} />
    </div>
  );
}
