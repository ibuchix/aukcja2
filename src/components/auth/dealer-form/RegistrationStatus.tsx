
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface RegistrationStatusProps {
  error?: string;
  emailVerified: boolean;
  registrationStep: number;
}

export function RegistrationStatus({ error, emailVerified, registrationStep }: RegistrationStatusProps) {
  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (registrationStep === 3 && !emailVerified) {
    return (
      <Alert className="mb-4 bg-[#EFEFFD] border-[#4B4DED]">
        <CheckCircle2 className="h-4 w-4 text-[#4B4DED]" />
        <AlertTitle className="text-[#4B4DED]">Email Verification Required</AlertTitle>
        <AlertDescription>
          We've sent a verification link to your email address. Please check your inbox and click the link to verify your account.
          After verification, your dealer application will be reviewed by our team.
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
