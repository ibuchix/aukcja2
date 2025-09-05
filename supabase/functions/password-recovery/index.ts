import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createServiceClient } from "../_shared/supabase-client.ts";

interface ResetPasswordRequest {
  email: string;
  taxId: string;
  businessRegistryNumber: string;
  supervisorName: string;
  newPassword: string;
}

interface RateLimitEntry {
  count: number;
  lastAttempt: number;
  locked: boolean;
}

const rateLimits = new Map<string, RateLimitEntry>();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const MAX_ATTEMPTS = 3;
const LOCKOUT_DURATION = 60 * 60 * 1000; // 1 hour lockout

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    const requestBody: ResetPasswordRequest = await req.json();
    const { email, taxId, businessRegistryNumber, supervisorName, newPassword } = requestBody;

    // Input validation
    if (!email || !taxId || !businessRegistryNumber || !supervisorName || !newPassword) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'All fields are required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get client IP for rate limiting
    const clientIP = req.headers.get('x-real-ip') || 
                    req.headers.get('x-forwarded-for') || 
                    'unknown';

    // Check rate limiting
    const now = Date.now();
    const rateKey = `${clientIP}:${email}`;
    const rateLimitEntry = rateLimits.get(rateKey);

    if (rateLimitEntry) {
      // Reset counter if window expired
      if (now - rateLimitEntry.lastAttempt > RATE_LIMIT_WINDOW) {
        rateLimits.delete(rateKey);
      } else if (rateLimitEntry.locked && now - rateLimitEntry.lastAttempt < LOCKOUT_DURATION) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Account temporarily locked due to too many failed attempts. Please try again later.' 
          }),
          { 
            status: 429, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      } else if (rateLimitEntry.count >= MAX_ATTEMPTS) {
        // Lock the account
        rateLimitEntry.locked = true;
        rateLimitEntry.lastAttempt = now;
        
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Too many failed attempts. Account locked for 1 hour.' 
          }),
          { 
            status: 429, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    }

    // Create Supabase service client
    const supabase = createServiceClient();

    // Verify dealer identity
    const { data: dealer, error: dealerError } = await supabase
      .from('dealers')
      .select('id, user_id, is_verified')
      .eq('user_id', (
        await supabase.auth.admin.getUserByEmail(email)
      ).data.user?.id || '')
      .eq('tax_id', taxId.replace(/[-\s]/g, ''))
      .eq('business_registry_number', businessRegistryNumber.replace(/[-\s]/g, ''))
      .ilike('supervisor_name', supervisorName.trim())
      .single();

    if (dealerError || !dealer) {
      // Increment rate limit counter
      const currentEntry = rateLimits.get(rateKey) || { count: 0, lastAttempt: 0, locked: false };
      currentEntry.count += 1;
      currentEntry.lastAttempt = now;
      rateLimits.set(rateKey, currentEntry);

      // Log failed attempt
      await supabase
        .from('audit_logs')
        .insert({
          action: 'password_reset_failed',
          entity_type: 'authentication',
          details: {
            email,
            ip: clientIP,
            reason: 'identity_verification_failed',
            timestamp: new Date().toISOString()
          }
        });

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Identity verification failed. Please check your details and try again.' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if dealer is verified
    if (!dealer.is_verified) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Only verified dealers can reset their passwords.' 
        }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Password must be at least 8 characters long.' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Update password using admin client
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      dealer.user_id,
      { 
        password: newPassword 
      }
    );

    if (updateError) {
      console.error('Password update error:', updateError);
      
      // Log failed password update
      await supabase
        .from('audit_logs')
        .insert({
          action: 'password_update_failed',
          entity_type: 'authentication',
          entity_id: dealer.user_id,
          details: {
            email,
            ip: clientIP,
            error: updateError.message,
            timestamp: new Date().toISOString()
          }
        });

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to update password. Please try again.' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Clear rate limiting on success
    rateLimits.delete(rateKey);

    // Log successful password reset
    await supabase
      .from('audit_logs')
      .insert({
        action: 'password_reset_success',
        entity_type: 'authentication',
        entity_id: dealer.user_id,
        details: {
          email,
          ip: clientIP,
          dealer_id: dealer.id,
          timestamp: new Date().toISOString()
        }
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Password reset successfully. You can now log in with your new password.' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Password recovery error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'An unexpected error occurred. Please try again.' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});