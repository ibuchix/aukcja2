
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";

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

  // Show status based on the step
  if (registrationStep === 2) {
    return (
      <Alert className="mb-4 bg-green-50 border-green-200">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-700">Account Created</AlertTitle>
        <AlertDescription className="text-green-700">
          Your account has been created successfully. You can now log in to access your dealer dashboard.
        </AlertDescription>
      </Alert>
    );
  }

  if (registrationStep === 3) {
    return (
      <Alert className="mb-4 bg-green-50 border-green-200">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-700">Account Ready</AlertTitle>
        <AlertDescription className="text-green-700">
          Your dealer account is now under review by our team.
          You will receive a notification once your account is approved.
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
