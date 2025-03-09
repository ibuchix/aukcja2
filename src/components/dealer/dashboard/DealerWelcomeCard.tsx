
import { useDealerProfile } from "@/contexts/DealerProfileContext";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

export function DealerWelcomeCard() {
  const { displayProfile, isLoading } = useDealerProfile();
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

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 shadow-sm">
      <div className="mb-2">
        {isLoading ? (
          <Skeleton className="h-8 w-64" />
        ) : (
          <h1 className="text-2xl font-bold text-gray-800">
            Welcome back, {dealerName}!
          </h1>
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
