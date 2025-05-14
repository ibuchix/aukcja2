
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { RegistrationCard } from "@/components/complete-registration/RegistrationCard";
import { RegistrationForm } from "@/components/complete-registration/RegistrationForm";
import { useCompleteRegistration } from "@/hooks/registration";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function CompleteRegistration() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  
  const { completeRegistration, isSubmitting, errors } = useCompleteRegistration();

  // Handle form submission
  const handleSubmit = async (formData: any) => {
    setFormErrors([]);
    const userId = state?.userId || userData?.id;
    
    if (!userId) {
      toast({
        title: "Error",
        description: "User ID is missing. Please try again.",
        variant: "destructive"
      });
      return;
    }

    const result = await completeRegistration(formData);

    if (!result.success) {
      console.error("Registration failed:", result.error);
      if (result.error) {
        setFormErrors(Array.isArray(result.error) ? result.error : [result.error]);
      }
    } else {
      navigate('/dealer/dashboard');
    }
  };
  
  // Fetch user data if we're in recovery mode but don't have userId in state
  useEffect(() => {
    async function fetchCurrentUser() {
      setIsLoading(true);
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          toast({
            title: "Authentication Required",
            description: "Please sign in to complete your registration.",
            variant: "destructive",
          });
          navigate('/auth');
          return;
        }
        
        setUserData(session.user);
      } catch (error) {
        console.error("Error fetching user:", error);
        toast({
          title: "Error",
          description: "Failed to fetch user information. Please try again.",
          variant: "destructive",
        });
        navigate('/auth');
      } finally {
        setIsLoading(false);
      }
    }
    
    // If we don't have userId in state but we're in an authenticated route, fetch current user
    if (!state?.userId && !userData) {
      fetchCurrentUser();
    } else {
      setIsLoading(false);
    }
  }, [state, navigate, toast, userData]);

  // Effect to handle invalid access
  useEffect(() => {
    if (!isLoading && !state?.userId && !userData?.id) {
      toast({
        title: "Invalid Access",
        description: "Please complete the registration process from the beginning.",
        variant: "destructive",
      });
      navigate('/auth');
    }
  }, [state, navigate, toast, isLoading, userData]);

  if (isLoading) {
    return (
      <RegistrationCard>
        <div className="py-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading registration details...</p>
        </div>
      </RegistrationCard>
    );
  }

  const isRecoveryMode = Boolean(state?.recovery);
  const userId = state?.userId || userData?.id;
  const userEmail = state?.email || userData?.email || '';

  return (
    <RegistrationCard>
      {isRecoveryMode && (
        <Alert className="mb-6 border-blue-200 bg-blue-50">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800">Profile Recovery</AlertTitle>
          <AlertDescription>
            We found your account but need to complete your dealer profile. 
            Please fill out the missing information below.
          </AlertDescription>
        </Alert>
      )}
      
      <RegistrationForm
        onSubmit={handleSubmit}
        defaultEmail={userEmail}
        isSubmitting={isSubmitting}
        formErrors={errors || []}
        showPasswordFields={false}
      />
    </RegistrationCard>
  );
}
