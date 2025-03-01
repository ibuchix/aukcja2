
import { useState } from "react";

export function useRegistrationSteps() {
  const [registrationStep, setRegistrationStep] = useState<number>(1);
  const [emailVerified, setEmailVerified] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>("");

  const moveToStep = (step: number) => {
    setRegistrationStep(step);
  };

  const resetError = () => {
    setAuthError("");
  };

  const setError = (error: string) => {
    setAuthError(error);
    setRegistrationStep(1);
  };

  return {
    registrationStep,
    emailVerified,
    authError,
    setEmailVerified,
    moveToStep,
    resetError,
    setError
  };
}
