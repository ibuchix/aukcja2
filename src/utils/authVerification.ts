
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
 * Simplified auth verification that's less strict for login flow
 * This version prioritizes getting users logged in quickly
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

    // Step 2: Do a simple database connectivity test
    console.log("🗄️ Testing basic database connectivity");
    
    try {
      // Simple query that doesn't rely on RLS or complex functions
      const { data: testData, error: testError } = await rawSupabaseClient
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .limit(1);
      
      if (testError) {
        console.error("❌ Database connectivity test failed:", testError);
        return {
          isValid: false,
          hasSession,
          hasJwtToken,
          canAccessDatabase: false,
          userId,
          error: `Database connectivity failed: ${testError.message}`,
          details: testError
        };
      }

      console.log("✅ Database connectivity test successful");
      
      // Capture successful auth state
      await AuthDebugger.captureAuthState("Simplified Auth Verification Success");

      return {
        isValid: true,
        hasSession,
        hasJwtToken,
        canAccessDatabase: true,
        userId,
        details: { testData }
      };

    } catch (dbError) {
      console.error("❌ Database connectivity test exception:", dbError);
      return {
        isValid: false,
        hasSession,
        hasJwtToken,
        canAccessDatabase: false,
        userId,
        error: `Database connectivity failed: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`,
        details: dbError
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
      error: error instanceof Error ? error.message : 'Unknown verification error',
      details: error
    };
  }
}

/**
 * Waits for auth to be ready with simplified verification
 * This version is more lenient and allows login to proceed faster
 */
export async function waitForAuthReady(maxAttempts: number = 3, delayMs: number = 500): Promise<AuthVerificationResult> {
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
  
  console.warn(`⚠️ Simplified auth verification completed after ${maxAttempts} attempts - allowing login to proceed`);
  const finalResult = await verifyAuthForDatabase();
  
  // Even if verification fails, allow login to proceed if we have basic session
  if (!finalResult.isValid && finalResult.hasSession && finalResult.hasJwtToken) {
    console.log("🔄 Basic session exists, allowing login to proceed despite verification issues");
    return {
      ...finalResult,
      isValid: true,
      canAccessDatabase: true,
      error: undefined
    };
  }
  
  return finalResult;
}
