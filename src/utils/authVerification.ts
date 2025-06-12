
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

interface DebugAuthResponse {
  auth_uid?: string;
  auth_role?: string;
  auth_email?: string;
}

/**
 * Verifies that the current auth session can access the database
 * This is crucial for ensuring RLS policies work correctly
 */
export async function verifyAuthForDatabase(): Promise<AuthVerificationResult> {
  try {
    console.log("🔍 Starting comprehensive auth verification for database access");
    
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

    // Step 2: Test database access with a simple authenticated query
    console.log("🗄️ Testing database access with authenticated query");
    
    try {
      // Use the debug function to test RLS and auth context
      const { data: debugData, error: debugError } = await rawSupabaseClient.rpc('debug_auth_context');
      
      if (debugError) {
        console.error("❌ Database access test failed:", debugError);
        return {
          isValid: false,
          hasSession,
          hasJwtToken,
          canAccessDatabase: false,
          userId,
          error: `Database access failed: ${debugError.message}`,
          details: debugError
        };
      }

      // Safely parse the debug response
      const debugResponse = debugData as DebugAuthResponse;
      const authContextWorking = debugResponse?.auth_uid === userId;
      
      console.log("🔍 Database access test results:", {
        debugData: debugResponse,
        authContextWorking,
        expectedUserId: userId,
        actualUserId: debugResponse?.auth_uid
      });

      if (!authContextWorking) {
        return {
          isValid: false,
          hasSession,
          hasJwtToken,
          canAccessDatabase: false,
          userId,
          error: "RLS auth context not working - JWT token not being recognized by database",
          details: { debugData: debugResponse, expectedUserId: userId }
        };
      }

      // Step 3: Test dealer-specific access
      console.log("👔 Testing dealer-specific database access");
      
      const { data: dealerData, error: dealerError } = await rawSupabaseClient
        .from('dealers')
        .select('id, user_id, dealership_name')
        .eq('user_id', userId)
        .limit(1);

      if (dealerError) {
        console.error("❌ Dealer access test failed:", dealerError);
        // This might be OK if user hasn't completed dealer registration yet
        console.log("⚠️ Dealer access failed, but basic auth is working");
      } else {
        console.log("✅ Dealer access test successful:", dealerData);
      }

      // Capture successful auth state
      await AuthDebugger.captureAuthState("Auth Verification Success");

      return {
        isValid: true,
        hasSession,
        hasJwtToken,
        canAccessDatabase: true,
        userId,
        details: { debugData: debugResponse, dealerData }
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
 * Waits for auth to be ready and database accessible
 * Returns a promise that resolves when auth is fully functional
 */
export async function waitForAuthReady(maxAttempts: number = 5, delayMs: number = 1000): Promise<AuthVerificationResult> {
  console.log(`⏳ Waiting for auth to be ready (max ${maxAttempts} attempts)`);
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`🔄 Auth verification attempt ${attempt}/${maxAttempts}`);
    
    const result = await verifyAuthForDatabase();
    
    if (result.isValid) {
      console.log(`✅ Auth ready after ${attempt} attempts`);
      return result;
    }
    
    if (attempt < maxAttempts) {
      console.log(`⏳ Auth not ready, waiting ${delayMs}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  console.error(`❌ Auth verification failed after ${maxAttempts} attempts`);
  const finalResult = await verifyAuthForDatabase();
  return finalResult;
}
