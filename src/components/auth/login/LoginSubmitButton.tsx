
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface LoginSubmitButtonProps {
  isLoading: boolean;
}

export function LoginSubmitButton({ isLoading }: LoginSubmitButtonProps) {
  return (
    <Button type="submit" className="w-full" disabled={isLoading}>
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Signing in...
        </>
      ) : "Zaloguj się"}
    </Button>
  );
}
