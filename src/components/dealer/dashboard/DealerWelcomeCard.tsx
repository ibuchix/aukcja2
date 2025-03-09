
import { useDealerProfile } from "@/contexts/DealerProfileContext";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

export function DealerWelcomeCard() {
  const { profile, isLoading } = useDealerProfile();
  const { user } = useAuth();
  
  const dealerName = profile?.supervisor_name || user?.email?.split('@')[0] || "Dealer";
  const dealershipName = profile?.dealership_name || "Your Dealership";

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
