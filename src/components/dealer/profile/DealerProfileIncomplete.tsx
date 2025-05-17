
import { AlertCircle, ArrowRight, UserCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface DealerProfileIncompleteProps {
  profileStatus: string;
  needsRecovery: boolean;
  initiateProfileRecovery: () => void;
}

export function DealerProfileIncomplete({ 
  profileStatus, 
  needsRecovery,
  initiateProfileRecovery 
}: DealerProfileIncompleteProps) {
  const navigate = useNavigate();
  
  // Not found profile case
  if (profileStatus === "not_found") {
    return (
      <Card className="mb-6 border-amber-200 bg-amber-50 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center text-lg font-semibold text-amber-800">
            <UserCircle2 className="h-5 w-5 mr-2 text-amber-600" />
            Profile Setup Required
          </CardTitle>
          <CardDescription className="text-amber-700">
            Your dealer profile needs to be created to unlock all features.
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-2">
          <p className="text-sm text-amber-700">
            We couldn't find your dealer profile. Please complete your registration to access all platform features.
          </p>
        </CardContent>
        <CardFooter>
          {needsRecovery ? (
            <Button 
              onClick={initiateProfileRecovery} 
              className="bg-amber-600 hover:bg-amber-700 text-white"
              size="sm"
            >
              Complete Your Profile <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button 
              onClick={() => navigate('/complete-registration')} 
              className="bg-amber-600 hover:bg-amber-700 text-white"
              size="sm"
            >
              Complete Registration <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  }
  
  // Incomplete profile case
  return (
    <Card className="mb-6 border-amber-200 bg-amber-50 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-lg font-semibold text-amber-800">
          <UserCircle2 className="h-5 w-5 mr-2 text-amber-600" />
          Incomplete Profile
        </CardTitle>
        <CardDescription className="text-amber-700">
          Your dealer profile is missing important information.
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-sm text-amber-700">
          Please update your profile with the required information to ensure full access to all features.
        </p>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={initiateProfileRecovery} 
          className="bg-amber-600 hover:bg-amber-700 text-white"
          size="sm"
        >
          Update Your Profile <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
