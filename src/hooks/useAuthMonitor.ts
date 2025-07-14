import { useEffect, useRef } from 'react';
import { validateCurrentSession } from '@/utils/sessionValidation';
import { supabase } from '@/integrations/supabase/client';

export function useAuthMonitor() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastValidationRef = useRef<number>(0);

  useEffect(() => {
    // Monitor session health every 30 seconds
    intervalRef.current = setInterval(async () => {
      const now = Date.now();
      
      // Skip if we validated recently (within 25 seconds)
      if (now - lastValidationRef.current < 25000) {
        return;
      }
      
      try {
        const validation = await validateCurrentSession();
        lastValidationRef.current = now;
        
        if (!validation.isValid) {
          console.warn(`🔍 Session validation failed: ${validation.reason}`);
          
          if (validation.reason === 'expired' || validation.reason === 'invalid_token') {
            console.log('🧹 Clearing corrupted session data');
            
            // Clear localStorage
            localStorage.removeItem('sb-auth-token');
            localStorage.removeItem('supabase.auth.token');
            
            // Clear any other auth-related items
            Object.keys(localStorage).forEach(key => {
              if (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth')) {
                localStorage.removeItem(key);
              }
            });
            
            // Trigger a session refresh to clean up internal state
            try {
              await supabase.auth.getSession();
            } catch (e) {
              console.warn('Session cleanup attempt failed:', e);
            }
          }
        }
      } catch (error) {
        console.warn('Session validation error:', error);
      }
    }, 30000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    validateSession: async () => {
      return await validateCurrentSession();
    }
  };
}