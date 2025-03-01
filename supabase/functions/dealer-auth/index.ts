
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handlers } from "./handlers.ts";
import { logOperation, logError } from "./logging.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { supabase } from "../_shared/supabase-client.ts";

// Concurrent registration lock registry
const registrationLocks = new Map();

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...data } = await req.json();
    logOperation(action, data);

    // Handle each action type
    switch (action) {
      case 'login':
        return await handlers.login(supabase, data, corsHeaders);
      
      case 'register':
        return await handlers.register(supabase, data, corsHeaders);
      
      case 'register-with-lock': {
        const email = data.email?.toLowerCase();
        if (!email) {
          return new Response(
            JSON.stringify({ success: false, error: "Email is required" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Check if there's an ongoing registration for this email
        if (registrationLocks.has(email)) {
          console.log(`Concurrent registration detected for ${email}`);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: "A registration with this email is already in progress. Please try again in a moment." 
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Set registration lock
        console.log(`Setting registration lock for ${email}`);
        registrationLocks.set(email, true);

        try {
          // Process registration with exclusive lock
          const result = await handlers.register(supabase, data, corsHeaders);
          return result;
        } finally {
          // Always release the lock when done
          console.log(`Releasing registration lock for ${email}`);
          registrationLocks.delete(email);
        }
      }
      
      default:
        return new Response(
          JSON.stringify({ success: false, error: `Unknown action: ${action}` }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    logError(error);
    return new Response(
      JSON.stringify({
        success: false,
        error: `Server error: ${error instanceof Error ? error.message : "Unknown error"}`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
