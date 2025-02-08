import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

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
  return null;
}