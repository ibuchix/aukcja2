
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createServiceClient, callRpcSafely } from "../_shared/supabase-client.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Extract the user ID from the headers instead of URL parameters
    const userId = req.headers.get("userId");
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "User ID is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    console.log(`Fetching dealer profile for user ID: ${userId}`);
    
    // Use service client to bypass RLS
    const serviceClient = createServiceClient();
    
    // Call the secure RPC function to get dealer profile
    const { data, error } = await callRpcSafely(
      serviceClient,
      'get_dealer_by_user_id',
      { p_user_id: userId }
    );
    
    if (error) {
      console.error("Error fetching dealer profile:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    if (!data) {
      console.log(`No dealer profile found for user ${userId}`);
      // Return a 200 status with null data instead of an error
      return new Response(
        JSON.stringify({ data: null }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    console.log("Successfully retrieved dealer profile");
    return new Response(
      JSON.stringify({ data }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    console.error("Server error:", error);
    return new Response(
      JSON.stringify({ error: "Server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
