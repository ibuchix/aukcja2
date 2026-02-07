
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface LoginSubmitButtonProps {
  isLoading: boolean;
  disabled?: boolean;
}

export function LoginSubmitButton({ isLoading, disabled }: LoginSubmitButtonProps) {
  return (
    <Button type="submit" className="w-full" disabled={isLoading || disabled}>
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Signing in...
        </>
      ) : "Zaloguj się"}
    </Button>
  );
}
