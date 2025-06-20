
import { supabase } from '@/integrations/supabase/client';

export interface AuthDebugInfo {
  sessionExists: boolean;
  userId: string | null;
  sessionExpiry: Date | null;
  authContextReady: boolean;
  dealerExists?: boolean;
  timestamp: Date;
}

export class AuthDebugger {
  private static logs: AuthDebugInfo[] = [];

  static async captureAuthState(context: string): Promise<AuthDebugInfo> {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    const debugInfo: AuthDebugInfo = {
      sessionExists: !!session,
      userId: session?.user?.id || null,
      sessionExpiry: session?.expires_at ? new Date(session.expires_at * 1000) : null,
      authContextReady: !!session && !error,
      timestamp: new Date()
    };

    // Try to check dealer existence if we have a user ID
    if (debugInfo.userId) {
      try {
        const { data: debugData } = await supabase.rpc('debug_auth_context');
        // Type assertion for RPC response
        const response = debugData as any;
        debugInfo.dealerExists = response?.dealer_exists || false;
      } catch (err) {
        console.warn('Could not check dealer existence:', err);
      }
    }

    console.log(`[AuthDebugger] ${context}:`, debugInfo);
    
    // Keep only last 10 logs
    this.logs.push(debugInfo);
    if (this.logs.length > 10) {
      this.logs.shift();
    }

    return debugInfo;
  }

  static getLogs(): AuthDebugInfo[] {
    return [...this.logs];
  }

  static isAuthReady(debugInfo?: AuthDebugInfo): boolean {
    if (!debugInfo) return false;
    return debugInfo.authContextReady && !!debugInfo.userId;
  }
}
