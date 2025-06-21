
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, BadgeCheck } from "lucide-react";

interface VerificationBannerProps {
  verificationStatus: string;
}

export function VerificationBanner({ verificationStatus }: VerificationBannerProps) {
  if (verificationStatus === 'pending') {
    return (
      <Alert variant="default" className="mb-4 bg-[#EFEFFD] border-[#4B4DED]">
        <AlertCircle className="h-4 w-4 text-[#4B4DED]" />
        <AlertTitle className="text-[#4B4DED]">Account Pending Verification</AlertTitle>
        <AlertDescription>
          Your account is currently under review. You'll be notified once verified.
        </AlertDescription>
      </Alert>
    );
  }
  
  if (verificationStatus === 'approved') {
    return (
      <Alert variant="default" className="mb-4 bg-green-50 border-green-200">
        <BadgeCheck className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-700">Account Verified</AlertTitle>
        <AlertDescription className="text-green-600">
          Your dealer account has been approved and verified.
        </AlertDescription>
      </Alert>
    );
  }
  
  if (verificationStatus === 'rejected') {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Account Rejected</AlertTitle>
        <AlertDescription>
          Your account verification was rejected. Please contact support for more information.
        </AlertDescription>
      </Alert>
    );
  }
  
  return null;
}
