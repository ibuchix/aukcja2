/**
 * Session debugging utility to capture JWT token forwarding issues
 */

import { supabase } from '@/integrations/supabase/client';

export interface SessionDebugInfo {
  timestamp: string;
  hasSession: boolean;
  userId: string | null;
  tokenLength: number;
  tokenPreview: string;
  expiresAt: string | null;
  isExpired: boolean;
  contextInfo?: string;
}

export class SessionDebugger {
  private static logs: SessionDebugInfo[] = [];
  
  static async captureSessionState(context: string): Promise<SessionDebugInfo> {
    const { data: sessionData, error } = await supabase.auth.getSession();
    
    const now = new Date();
    const debugInfo: SessionDebugInfo = {
      timestamp: now.toISOString(),
      hasSession: !!sessionData.session,
      userId: sessionData.session?.user?.id || null,
      tokenLength: sessionData.session?.access_token?.length || 0,
      tokenPreview: sessionData.session?.access_token ? 
        sessionData.session.access_token.substring(0, 20) + '...' : 'none',
      expiresAt: sessionData.session?.expires_at ? 
        new Date(sessionData.session.expires_at * 1000).toISOString() : null,
      isExpired: sessionData.session?.expires_at ? 
        (sessionData.session.expires_at * 1000) < now.getTime() : false,
      contextInfo: context
    };
    
    if (error) {
      console.error(`[SessionDebugger] ${context} - Session error:`, error);
    }
    
    console.log(`[SessionDebugger] ${context}:`, debugInfo);
    
    // Keep only last 20 logs
    this.logs.push(debugInfo);
    if (this.logs.length > 20) {
      this.logs.shift();
    }
    
    return debugInfo;
  }
  
  static getLogs(): SessionDebugInfo[] {
    return [...this.logs];
  }
  
  static hasValidSession(debugInfo: SessionDebugInfo): boolean {
    return debugInfo.hasSession && 
           debugInfo.userId !== null && 
           debugInfo.tokenLength > 0 && 
           !debugInfo.isExpired;
  }
}
