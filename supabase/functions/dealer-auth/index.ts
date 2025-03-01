
import { corsHeaders } from "../_shared/cors.ts";
import { handlers } from "./handlers.ts";

// Create a map to track concurrent registration attempts
const registrationLocks = new Map<string, boolean>();

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // Get the function name from the URL
  const url = new URL(req.url);
  const functionName = url.pathname.split("/").pop();

  try {
    // Check if the function exists in handlers
    if (functionName && handlers[functionName]) {
      // Special case for register-with-lock to pass the locks map
      if (functionName === "register-with-lock") {
        return await handlers[functionName](req, registrationLocks);
      }
      
      // Regular handler call
      return await handlers[functionName](req);
    }

    // Function not found
    return new Response(
      JSON.stringify({
        success: false,
        error: `Function ${functionName} not found`
      }),
      {
        status: 404,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    // Unexpected server error
    console.error(`Error executing ${functionName}:`, error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: `Internal server error: ${error.message || "Unknown error"}`
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }
});
