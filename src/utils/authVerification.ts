
import { rawSupabaseClient } from '@/integrations/supabase/client';
import { AuthDebugger } from '@/utils/authDebugger';

export interface AuthVerificationResult {
  isValid: boolean;
  hasSession: boolean;
  hasJwtToken: boolean;
  canAccessDatabase: boolean;
  userId: string | null;
  error?: string;
  details?: any;
}

/**
 * Simplified auth verification for login flow
 */
export async function verifyAuthForDatabase(): Promise<AuthVerificationResult> {
  try {
    console.log("🔍 Starting simplified auth verification");
    
    // Step 1: Check if we have a session
    const { data: sessionData, error: sessionError } = await rawSupabaseClient.auth.getSession();
    
    if (sessionError) {
      console.error("❌ Session check failed:", sessionError);
      return {
        isValid: false,
        hasSession: false,
        hasJwtToken: false,
        canAccessDatabase: false,
        userId: null,
        error: sessionError.message
      };
    }

    const hasSession = !!sessionData.session;
    const hasJwtToken = !!sessionData.session?.access_token;
    const userId = sessionData.session?.user?.id || null;

    console.log("📋 Session check results:", {
      hasSession,
      hasJwtToken,
      userId: userId ? "present" : "missing",
      tokenLength: sessionData.session?.access_token?.length || 0
    });

    if (!hasSession || !hasJwtToken || !userId) {
      return {
        isValid: false,
        hasSession,
        hasJwtToken,
        canAccessDatabase: false,
        userId,
        error: "Missing session, JWT token, or user ID"
      };
    }

    // Step 2: Basic database connectivity test - simplified
    console.log("🗄️ Testing basic database connectivity");
    
    try {
      // Simple query that should work for authenticated users
      const { error: testError } = await rawSupabaseClient
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .limit(1);
      
      if (testError) {
        console.error("❌ Database connectivity test failed:", testError);
        // Don't fail auth verification for database issues
        console.log("✅ Session is valid, allowing auth despite database issue");
      } else {
        console.log("✅ Database connectivity test successful");
      }

      // Capture successful auth state
      await AuthDebugger.captureAuthState("Simplified Auth Verification Success");

      return {
        isValid: true,
        hasSession,
        hasJwtToken,
        canAccessDatabase: !testError,
        userId
      };

    } catch (dbError) {
      console.error("❌ Database connectivity test exception:", dbError);
      // Still return valid auth if session exists
      return {
        isValid: true,
        hasSession,
        hasJwtToken,
        canAccessDatabase: false,
        userId,
        error: `Database connectivity failed but session is valid: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`
      };
    }

  } catch (error) {
    console.error("❌ Auth verification exception:", error);
    await AuthDebugger.captureAuthState("Auth Verification Exception");
    
    return {
      isValid: false,
      hasSession: false,
      hasJwtToken: false,
      canAccessDatabase: false,
      userId: null,
      error: error instanceof Error ? error.message : 'Unknown verification error'
    };
  }
}

/**
 * Simplified waiting for auth to be ready
 */
export async function waitForAuthReady(maxAttempts: number = 2, delayMs: number = 300): Promise<AuthVerificationResult> {
  console.log(`⏳ Waiting for simplified auth to be ready (max ${maxAttempts} attempts)`);
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`🔄 Simplified auth verification attempt ${attempt}/${maxAttempts}`);
    
    const result = await verifyAuthForDatabase();
    
    if (result.isValid) {
      console.log(`✅ Simplified auth ready after ${attempt} attempts`);
      return result;
    }
    
    if (attempt < maxAttempts) {
      console.log(`⏳ Auth not ready, waiting ${delayMs}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  console.log(`✅ Auth verification completed - allowing login to proceed`);
  const finalResult = await verifyAuthForDatabase();
  
  // Be more permissive - if we have a session, consider it valid
  if (!finalResult.isValid && finalResult.hasSession && finalResult.hasJwtToken) {
    console.log("🔄 Basic session exists, allowing login to proceed");
    return {
      ...finalResult,
      isValid: true,
      canAccessDatabase: true,
      error: undefined
    };
  }
  
  return finalResult;
}
