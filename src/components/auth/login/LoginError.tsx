
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface LoginErrorProps {
  error: string | null;
  loginAttempted: boolean;
}

export function LoginError({ error, loginAttempted }: LoginErrorProps) {
  // If there's no error or login wasn't attempted yet, don't render
  if (!error) return null;

  // Determine error category and translate messages
  const isDealerRestriction = typeof error === "string" && error.toLowerCase().includes("restricted to dealer");
  let displayMessage = error;
  
  if (isDealerRestriction) {
    displayMessage = "Ta aplikacja jest przeznaczona wyłącznie dla dealerów. Zarejestruj się jako dealer.";
  } else if (typeof error === "string" && error.toLowerCase().includes("invalid email")) {
    displayMessage = "Wprowadź poprawny adres e-mail";
  }

  return (
    <Alert variant="destructive" role="alert" aria-live="polite">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>{displayMessage}</AlertDescription>
    </Alert>
  );
}
