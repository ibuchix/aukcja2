
import { User } from "@supabase/supabase-js";
import { Building2, User as UserIcon, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useDealerProfile } from "@/contexts/DealerProfileContext";
import { useAuth } from "@/contexts/AuthContext";

export const ProfileInfoSection = () => {
  const { profile, isLoading } = useDealerProfile();
  const { user } = useAuth();

  return (
    <div className="mb-10 bg-white shadow-sm rounded-lg overflow-hidden">
      <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100">
        <h2 className="text-xl font-semibold flex items-center">
          <UserIcon className="mr-2 h-5 w-5 text-primary" />
          Business Profile
        </h2>
      </div>
      
      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Dealer Information */}
        <div>
          <h3 className="font-medium text-dark mb-4 pb-2 border-b border-gray-100 flex items-center">
            <UserIcon className="mr-2 h-4 w-4 text-primary" />
            Dealer Information
          </h3>
          
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ) : (
            <div className="space-y-3 text-subtitle-text">
              <p><span className="font-medium text-dark">Name:</span> {profile?.supervisor_name || "Not available"}</p>
              <p><span className="font-medium text-dark">Email:</span> {user?.email || "Not available"}</p>
              <p><span className="font-medium text-dark">Dealership:</span> {profile?.dealership_name || "Not available"}</p>
            </div>
          )}
        </div>
        
        {/* Company Information */}
        <div>
          <h3 className="font-medium text-dark mb-4 pb-2 border-b border-gray-100 flex items-center">
            <Building2 className="mr-2 h-4 w-4 text-primary" />
            Company Information
          </h3>
          
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ) : (
            <div className="space-y-3 text-subtitle-text">
              <p><span className="font-medium text-dark">Address:</span> {profile?.address || "Not available"}</p>
              <p><span className="font-medium text-dark">License:</span> {profile?.license_number || "Not available"}</p>
              <p><span className="font-medium text-dark">Tax ID:</span> {profile?.tax_id || "Not available"}</p>
            </div>
          )}
        </div>
        
        {/* Additional Details */}
        <div>
          <h3 className="font-medium text-dark mb-4 pb-2 border-b border-gray-100 flex items-center">
            <FileText className="mr-2 h-4 w-4 text-primary" />
            Additional Details
          </h3>
          
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : (
            <div className="space-y-3 text-subtitle-text">
              <p><span className="font-medium text-dark">Business Registry:</span> {profile?.business_registry_number || "Not available"}</p>
              <p><span className="font-medium text-dark">Account Status:</span> <span className="text-success font-medium">Active</span></p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
