
import { DealerInfoCard } from "./DealerInfoCard";
import { CompanyInfoCard } from "./CompanyInfoCard";
import { AdditionalDetailsCard } from "./AdditionalDetailsCard";
import { User } from "@supabase/supabase-js";

interface ProfileInfoSectionProps {
  dealerProfile: any;
  user: User | null;
  isLoading: boolean;
}

export const ProfileInfoSection = ({ dealerProfile, user, isLoading }: ProfileInfoSectionProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <DealerInfoCard 
        dealerProfile={dealerProfile} 
        userEmail={user?.email} 
        isLoading={isLoading} 
      />
      <CompanyInfoCard 
        dealerProfile={dealerProfile} 
        isLoading={isLoading} 
      />
      <AdditionalDetailsCard 
        dealerProfile={dealerProfile} 
        isLoading={isLoading} 
      />
    </div>
  );
};
