
import { Building2, User as UserIcon, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useDealerProfile } from "@/contexts/dealer-profile";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { isDealerVerified } from "@/types/dealer";

export const ProfileInfoSection = () => {
  const { displayProfile, isLoading, error, refreshProfile } = useDealerProfile();
  const { user } = useAuth();
  const navigate = useNavigate();

  console.log('ProfileInfoSection - Profile data:', {
    displayProfile,
    isLoading,
    error,
    userId: user?.id
  });

  if (error && !displayProfile) {
    return (
      <Alert variant="destructive">
        <AlertDescription className="space-y-4">
          <p>{error}</p>
          <div className="flex gap-2">
            <Button onClick={refreshProfile} variant="outline" size="sm">
              Ponów
            </Button>
            <Button 
              onClick={() => navigate('/complete-registration')} 
              variant="outline" 
              size="sm"
            >
              Dokończ rejestrację
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Check if dealer is verified using our helper function
  const isVerified = isDealerVerified(displayProfile);

  return (
    <div className="mb-10 bg-secondary shadow-sm rounded-lg overflow-hidden border border-accent/20">
      <div className="bg-background px-6 py-4 border-b border-accent/20">
        <h2 className="text-xl font-semibold flex items-center text-body-text">
          <UserIcon className="mr-2 h-5 w-5 text-primary" />
          Profil biznesowy
        </h2>
      </div>
      
      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Dealer Information */}
        <div>
          <h3 className="font-medium text-body-text mb-4 pb-2 border-b border-accent/20 flex items-center">
            <UserIcon className="mr-2 h-4 w-4 text-primary" />
            Informacje o dealerze
          </h3>
          
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ) : (
            <div className="space-y-3 text-subtitle-text">
              <p><span className="font-medium text-body-text">Nazwisko:</span> {displayProfile?.supervisor_name || "Niedostępne"}</p>
              <p><span className="font-medium text-body-text">E-mail:</span> {user?.email || "Niedostępne"}</p>
              <p><span className="font-medium text-body-text">Dealer:</span> {displayProfile?.dealership_name || "Niedostępne"}</p>
              <p>
                <span className="font-medium text-body-text">Status:</span> 
                <span className={`ml-1 ${isVerified ? 'text-success' : 'text-warning'}`}>
                  {isVerified ? 'Zatwierdzony' : (displayProfile?.verification_status || 'Oczekujący')}
                </span>
              </p>
            </div>
          )}
        </div>
        
        {/* Company Information */}
        <div>
          <h3 className="font-medium text-body-text mb-4 pb-2 border-b border-accent/20 flex items-center">
            <Building2 className="mr-2 h-4 w-4 text-primary" />
            Informacje o firmie
          </h3>
          
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ) : (
            <div className="space-y-3 text-subtitle-text">
              <p><span className="font-medium text-body-text">Adres:</span> {displayProfile?.address || "Niedostępne"}</p>
              <p><span className="font-medium text-body-text">Regon:</span> {displayProfile?.license_number || "Niedostępne"}</p>
              <p><span className="font-medium text-body-text">NIP:</span> {displayProfile?.tax_id || "Niedostępne"}</p>
            </div>
          )}
        </div>
        
        {/* Additional Details */}
        <div>
          <h3 className="font-medium text-body-text mb-4 pb-2 border-b border-accent/20 flex items-center">
            <FileText className="mr-2 h-4 w-4 text-primary" />
            Dodatkowe szczegóły
          </h3>
          
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : (
            <div className="space-y-3 text-subtitle-text">
              <p><span className="font-medium text-body-text">Rejestr działalności:</span> {displayProfile?.business_registry_number || "Niedostępne"}</p>
              <p><span className="font-medium text-body-text">Status konta:</span> <span className="text-success font-medium">Aktywny</span></p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
