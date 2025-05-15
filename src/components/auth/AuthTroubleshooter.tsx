
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { getAuthDiagnostics, clearAuthStorage } from "@/utils/auth-utils";

export function AuthTroubleshooter() {
  const [expanded, setExpanded] = useState(false);
  const [diagnostics, setDiagnostics] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runDiagnostics = () => {
    setIsLoading(true);
    setTimeout(() => {
      setDiagnostics(getAuthDiagnostics());
      setIsLoading(false);
    }, 500);
  };

  const handleClearAuth = () => {
    clearAuthStorage();
    runDiagnostics();
  };

  return (
    <div className="border rounded-md p-4">
      <Button
        variant="ghost"
        className="w-full justify-between"
        onClick={() => setExpanded(!expanded)}
      >
        Authentication Troubleshooter
        <span className="text-xs">{expanded ? '▲' : '▼'}</span>
      </Button>

      {expanded && (
        <div className="pt-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={runDiagnostics} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Run Diagnostics'}
            </Button>
            <Button size="sm" variant="outline" onClick={handleClearAuth}>
              Clear Auth Storage
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link to="/test-auth">Test Auth Utility</Link>
            </Button>
          </div>

          {diagnostics && (
            <div className="p-3 bg-muted rounded-md overflow-auto max-h-40 text-xs">
              <pre>{JSON.stringify(diagnostics, null, 2)}</pre>
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            <p>Common issues:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Password whitespace issues - try typing password manually</li>
              <li>Auth token conflicts - try clearing auth storage</li>
              <li>Browser extensions blocking authentication - try incognito mode</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
