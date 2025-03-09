
import { useDealerProfile } from "@/contexts/DealerProfileContext";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";

export function DealerWelcomeCard() {
  const { displayProfile, isLoading, profileIsComplete, missingFields } = useDealerProfile();
  const { user } = useAuth();
  
  // Get dealer name with better fallback handling
  const getDealerName = () => {
    if (displayProfile?.supervisorName) {
      return displayProfile.supervisorName;
    } else if (user?.email) {
      // Extract name from email (before @ symbol)
      const namePart = user.email.split('@')[0];
      // Capitalize first letter
      return namePart.charAt(0).toUpperCase() + namePart.slice(1);
    }
    return "Dealer";
  };
  
  const dealerName = getDealerName();
  const dealershipName = displayProfile?.dealershipName || "Your Dealership";

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
        {isLoading ? (
          <Skeleton className="h-8 w-64" />
        ) : (
          <h1 className="text-2xl font-bold text-gray-800">
            Welcome back, {dealerName}!
          </h1>
        )}
        
        {!isLoading && (
          <div className="flex items-center gap-2">
            {profileIsComplete ? (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Profile Complete
              </Badge>
            ) : (
              <Tooltip content={
                <div className="p-2 max-w-xs">
                  <p className="font-semibold mb-1">Missing information:</p>
                  <ul className="list-disc pl-4 text-sm">
                    {missingFields.map((field, i) => (
                      <li key={i}>{formatMissingFieldName(field)}</li>
                    ))}
                  </ul>
                </div>
              }>
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Incomplete Profile
                </Badge>
              </Tooltip>
            )}
          </div>
        )}
      </div>
      <div>
        {isLoading ? (
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
