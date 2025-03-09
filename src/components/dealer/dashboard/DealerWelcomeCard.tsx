
import { useEffect, useState } from "react";
import { useDealerProfile } from "@/contexts/dealer-profile";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { 
  formatNameForDisplay, 
  getValueWithFallback, 
  formatPhoneNumberForDisplay 
} from "@/utils/dealer-profile-utils/formatters";
import { verifyUserProfileIntegrity, recoverDealerProfile } from "@/utils/dealer-profile-utils/recovery";
import { useToast } from "@/hooks/use-toast";

export function DealerWelcomeCard() {
  const { displayProfile, isLoading, profileIsComplete, missingFields = [], refreshProfile } = useDealerProfile();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isRecovering, setIsRecovering] = useState(false);
  
  // Verify profile integrity on component mount
  useEffect(() => {
    async function checkProfileIntegrity() {
      try {
        // Only proceed if we're not in a loading state
        if (!isLoading && user) {
          const { complete, needsRecovery } = await verifyUserProfileIntegrity();
          
          if (!complete && needsRecovery && !isRecovering) {
            console.log("Profile integrity check failed, attempting recovery");
            setIsRecovering(true);
            
            const { success, needsCompletion } = await recoverDealerProfile();
            
            if (success) {
              if (needsCompletion) {
                toast({
                  title: "Profile Needs Completion",
                  description: "Your profile has been partially recovered, but requires more information.",
                });
                
                // Navigate to completion form
                navigate('/complete-registration', { 
                  state: { userId: user.id, recovery: true } 
                });
              } else {
                toast({
                  title: "Profile Recovered",
                  description: "Your profile has been recovered successfully.",
                });
                
                // Refresh profile data
                await refreshProfile();
              }
            }
            
            setIsRecovering(false);
          }
        }
      } catch (error) {
        console.error("Error in profile integrity check:", error);
        setIsRecovering(false);
      }
    }
    
    // Run the check
    checkProfileIntegrity();
  }, [isLoading, user, navigate, toast, refreshProfile]);
  
  // Get dealer name with better fallback handling
  const getDealerName = () => {
    if (displayProfile?.supervisorName) {
      return formatNameForDisplay(displayProfile.supervisorName);
    } else if (user?.email) {
      // Extract name from email (before @ symbol)
      const namePart = user.email.split('@')[0];
      // Format with proper casing
      return formatNameForDisplay(namePart.replace(/[._-]/g, ' '));
    }
    return "Dealer";
  };
  
  const dealerName = getDealerName();
  const dealershipName = getValueWithFallback(displayProfile?.dealershipName, "Your Dealership");

  // Format missing fields for display
  const formatMissingFieldName = (field: string) => {
    if (field === 'profile_not_found') return 'Profile Not Found';
    
    // Convert camelCase or snake_case to Title Case with spaces
    return field
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/^\w/, c => c.toUpperCase());
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        {isLoading || isRecovering ? (
          <Skeleton className="h-8 w-64" />
        ) : (
          <h1 className="text-2xl font-bold text-gray-800">
            Welcome back, {dealerName}!
          </h1>
        )}
        
        {!isLoading && !isRecovering && (
          <div className="flex items-center gap-2">
            {profileIsComplete ? (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Profile Complete
              </Badge>
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1 cursor-help">
                      <AlertCircle className="h-3.5 w-3.5" />
                      Incomplete Profile
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent className="p-2 max-w-xs">
                    <div>
                      {missingFields && missingFields.length > 0 ? (
                        <>
                          <p className="font-semibold mb-1">Missing information:</p>
                          <ul className="list-disc pl-4 text-sm">
                            {missingFields.map((field, i) => (
                              <li key={i}>{formatMissingFieldName(field)}</li>
                            ))}
                          </ul>
                        </>
                      ) : (
                        <p>Your profile is incomplete. Please update your information.</p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        )}
      </div>
      <div>
        {isLoading || isRecovering ? (
          <Skeleton className="h-5 w-96" />
        ) : (
          <p className="text-gray-600">
            What would you like to do today at {dealershipName}?
          </p>
        )}
      </div>
    </div>
  );
}
