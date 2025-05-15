
import { Loader2 } from "lucide-react";

export function InitializingState() {
  return (
    <div className="container flex flex-col items-center justify-center h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <div className="text-muted-foreground">Initializing authentication system...</div>
      <div className="text-xs text-muted-foreground mt-2">This may take a moment</div>
    </div>
  );
}
