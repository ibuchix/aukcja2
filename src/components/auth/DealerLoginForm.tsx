
import { useState } from "react";
import { useEmailForm } from "./login/useEmailForm";
import { useOtpForm } from "./login/useOtpForm";
import { EmailForm } from "./login/EmailForm";
import { OtpForm } from "./login/OtpForm";

export function DealerLoginForm() {
  // Use state to track the current step and email
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  
  // Use the OTP form hook with the current email and step setter
  const {
    isSubmitting: otpIsLoading,
    isResending: otpIsResending,
    otpForm,
    handleSubmit: onOtpSubmit,
    handleResendOtp,
    handleBackToEmail,
    resetOtpForm,
    error: otpError
  } = useOtpForm(email, setStep);
  
  // Use the email form hook with the step setter and email setter
  const {
    isLoading: emailIsLoading,
    emailForm,
    onEmailSubmit
  } = useEmailForm(setStep, setEmail, resetOtpForm);

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="text-lg font-medium">Dealer Login</h3>
        <p className="text-sm text-muted-foreground">
          {step === "email" 
            ? "Enter your email to receive a login code" 
            : "Enter the code sent to your email"}
        </p>
      </div>

      {step === "email" ? (
        <EmailForm 
          form={emailForm} 
          onSubmit={onEmailSubmit} 
          isLoading={emailIsLoading}
        />
      ) : (
        <OtpForm
          form={otpForm}
          onSubmit={onOtpSubmit}
          isLoading={otpIsLoading}
          isResending={otpIsResending}
          onBackToEmail={handleBackToEmail}
          onResendOtp={handleResendOtp}
        />
      )}
    </div>
  );
}
