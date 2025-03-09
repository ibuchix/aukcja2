
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Mail, Info } from "lucide-react";

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
        <AlertTitle>Registration Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // Show verification status based on the step
  if (registrationStep === 2) {
    return (
      <Alert className="mb-4 bg-amber-50 border-amber-200">
        <Info className="h-4 w-4 text-amber-500" />
        <AlertTitle className="text-amber-700">Account Created</AlertTitle>
        <AlertDescription className="text-amber-700">
          Your account has been created. We've sent a verification link to your email address. 
          Please check your inbox (and spam folder) and click the link to verify your account.
        </AlertDescription>
      </Alert>
    );
  }

  if (registrationStep === 3 && !emailVerified) {
    return (
      <Alert className="mb-4 bg-[#EFEFFD] border-[#4B4DED]">
        <Mail className="h-4 w-4 text-[#4B4DED]" />
        <AlertTitle className="text-[#4B4DED]">Email Verification Required</AlertTitle>
        <AlertDescription>
          We've sent a verification link to your email address. Please check your inbox and click the link to verify your account.
          After verification, your dealer application will be reviewed by our team.
        </AlertDescription>
      </Alert>
    );
  }

  if (registrationStep === 3 && emailVerified) {
    return (
      <Alert className="mb-4 bg-green-50 border-green-200">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-700">Email Verified</AlertTitle>
        <AlertDescription className="text-green-700">
          Your email has been verified. Your dealer application is now under review by our team.
          You will receive a notification once your account is approved.
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
