
import { AuthTroubleshooter } from "@/components/auth/AuthTroubleshooter";
import { ClearAuthStateButton } from "@/components/auth/ClearAuthStateButton";
import { TestAccountUtil } from "@/components/auth/TestAccountUtil";

export default function TestAuth() {
  return (
    <div className="container py-8 space-y-8">
      <div className="text-center max-w-2xl mx-auto mb-6">
        <h1 className="text-3xl font-bold mb-2">Authentication Testing Page</h1>
        <p className="text-muted-foreground">
          Use this utility to test the registration and login process with automatically generated credentials.
        </p>
      </div>
      
      <TestAccountUtil />
      
      <div className="max-w-md mx-auto border-t pt-6">
        <h2 className="text-xl font-medium mb-4">Troubleshooting Tools</h2>
        <div className="space-y-4">
          <AuthTroubleshooter />
          <div className="flex justify-center">
            <ClearAuthStateButton />
          </div>
        </div>
      </div>
    </div>
  );
}
