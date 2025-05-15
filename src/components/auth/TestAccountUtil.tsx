
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { createTestAccount, testLogin } from "@/utils/create-test-account";
import { useToast } from "@/components/ui/use-toast";

export function TestAccountUtil() {
  const [isCreating, setIsCreating] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testAccount, setTestAccount] = useState<{email: string, password: string} | null>(null);
  const [testResult, setTestResult] = useState<{success: boolean, message: string} | null>(null);
  const { toast } = useToast();

  const handleCreateTestAccount = async () => {
    setIsCreating(true);
    try {
      const result = await createTestAccount();
      
      if (result.success) {
        setTestAccount({
          email: result.email,
          password: result.password
        });
        setTestResult(null);
        
        toast({
          title: "Test account created",
          description: `Email: ${result.email}`,
        });
      } else {
        setTestResult({
          success: false,
          message: result.error || "Failed to create test account"
        });
        toast({
          title: "Error creating test account",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : "Unknown error occurred"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleTestLogin = async () => {
    if (!testAccount) return;
    
    setIsTesting(true);
    try {
      const result = await testLogin(testAccount.email, testAccount.password);
      
      if (result.success) {
        setTestResult({
          success: true,
          message: "Login successful! The authentication flow works correctly."
        });
        toast({
          title: "Test login successful",
          description: "The authentication flow is working correctly.",
        });
      } else {
        setTestResult({
          success: false,
          message: result.error || "Login failed"
        });
        toast({
          title: "Test login failed",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : "Unknown error occurred"
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Authentication Test Utility</CardTitle>
        <CardDescription>Create and test a dealer account automatically</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {testAccount ? (
          <div className="p-3 bg-muted rounded-md">
            <p className="font-medium mb-2">Test Account Created:</p>
            <div className="grid grid-cols-[auto_1fr] gap-x-2 text-sm">
              <span className="font-medium">Email:</span>
              <span className="font-mono">{testAccount.email}</span>
              <span className="font-medium">Password:</span>
              <span className="font-mono">{testAccount.password}</span>
            </div>
          </div>
        ) : (
          <Button 
            onClick={handleCreateTestAccount} 
            disabled={isCreating}
            className="w-full"
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Test Account...
              </>
            ) : "Create Test Account"}
          </Button>
        )}

        {testAccount && (
          <Button 
            onClick={handleTestLogin} 
            disabled={isTesting || !testAccount}
            className="w-full"
          >
            {isTesting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing Login...
              </>
            ) : "Test Login with Created Account"}
          </Button>
        )}

        {testResult && (
          <div className={`p-3 rounded-md ${testResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="flex items-center gap-2 font-medium mb-1">
              {testResult.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span className={testResult.success ? 'text-green-700' : 'text-red-700'}>
                {testResult.success ? 'Test Passed' : 'Test Failed'}
              </span>
            </div>
            <p className={`text-sm ${testResult.success ? 'text-green-600' : 'text-red-600'}`}>
              {testResult.message}
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-center text-xs text-muted-foreground">
        This utility creates a real account in the database
      </CardFooter>
    </Card>
  );
}
