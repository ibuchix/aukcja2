
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { translateErrorMessage } from "@/lib/vehicleTranslations";

interface RegistrationStatusProps {
  error: string;
  emailVerified: boolean;
  registrationStep: number;
}

export function RegistrationStatus({ error, emailVerified, registrationStep }: RegistrationStatusProps) {
  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTitle>{translateErrorMessage('Registration Error')}</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // We've removed the mention of verification emails
  // since they're not needed anymore
  if (registrationStep > 1) {
    return (
      <Alert variant="default" className="mb-4 bg-blue-50 border-blue-200">
        <AlertTitle className="text-blue-800">{translateErrorMessage('Registration in Progress')}</AlertTitle>
        <AlertDescription className="text-blue-700">
          {translateErrorMessage('Please complete the remaining steps to finish your registration.')}
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
