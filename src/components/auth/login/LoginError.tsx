
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface LoginErrorProps {
  error: string | null;
  loginAttempted: boolean;
}

export function LoginError({ error, loginAttempted }: LoginErrorProps) {
  // If there's no error or login wasn't attempted yet, don't render
  if (!error) return null;

  // Determine error category to control hint visibility
  const isDealerRestriction = typeof error === "string" && error.toLowerCase().includes("restricted to dealer");
  const displayMessage = isDealerRestriction
    ? "Ta aplikacja jest przeznaczona wyłącznie dla dealerów. Zarejestruj się jako dealer."
    : error;
  const showWhitespaceHint = loginAttempted && !isDealerRestriction;

  return (
    <div className="space-y-4">
      <Alert variant="destructive" role="alert" aria-live="polite">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{displayMessage}</AlertDescription>
      </Alert>

      {showWhitespaceHint && (
        <Alert variant="destructive" className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Your password may have been saved with extra whitespace. Try typing your password manually instead of using autofill.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
