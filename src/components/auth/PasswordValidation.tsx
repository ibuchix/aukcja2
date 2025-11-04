// Password validation component with generator - Updated 2025-11-04
import { Check, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PasswordRequirement {
  label: string;
  regex: RegExp;
}

interface PasswordValidationProps {
  password: string;
  className?: string;
  onGeneratePassword?: () => void;
}

export function PasswordValidation({ password, className = "", onGeneratePassword }: PasswordValidationProps) {
  const requirements: PasswordRequirement[] = [
    { label: "Co najmniej 12 znaków", regex: /.{12,}/ },
    { label: "Co najmniej jedna wielka litera", regex: /[A-Z]/ },
    { label: "Co najmniej jedna mała litera", regex: /[a-z]/ },
    { label: "Co najmniej jedna cyfra", regex: /[0-9]/ },
    { label: "Co najmniej jeden znak specjalny", regex: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/ }
  ];

  return (
    <div className={`text-sm space-y-2 mt-1 ${className}`}>
      {onGeneratePassword && (
        <Button
          type="button"
          onClick={onGeneratePassword}
          variant="outline"
          size="sm"
          className="w-full mb-3 border-[#D81B24] text-[#D81B24] hover:bg-[#D81B24] hover:text-white"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Wygeneruj silne hasło
        </Button>
      )}
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
