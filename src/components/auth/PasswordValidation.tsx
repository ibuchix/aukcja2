
import { useState } from "react";
import { Check, X } from "lucide-react";

interface PasswordRequirement {
  label: string;
  regex: RegExp;
}

interface PasswordValidationProps {
  password: string;
  className?: string;
}

export function PasswordValidation({ password, className = "" }: PasswordValidationProps) {
  const requirements: PasswordRequirement[] = [
    { label: "At least 8 characters", regex: /.{8,}/ },
    { label: "At least one uppercase letter", regex: /[A-Z]/ },
    { label: "At least one lowercase letter", regex: /[a-z]/ },
    { label: "At least one number", regex: /[0-9]/ },
    { label: "At least one special character", regex: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/ }
  ];

  return (
    <div className={`text-sm space-y-2 mt-1 ${className}`}>
      {requirements.map((requirement, index) => {
        const isMet = requirement.regex.test(password);
        return (
          <div key={index} className="flex items-center gap-2">
            {isMet ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <X className="h-4 w-4 text-destructive" />
            )}
            <span className={isMet ? "text-green-500" : "text-muted-foreground"}>
              {requirement.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
