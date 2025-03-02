
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { handleRequest } from "./handlers.ts";
import { setupCORS } from "../_shared/cors.ts";
import { logInfo, logError } from "./logging.ts";

console.log("dealer-auth function booted");

// This is the main entry point for the edge function
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return setupCORS(req, new Response(null, { status: 204 }));
  }
  
  try {
    logInfo("Received request to dealer-auth function");
    const response = await handleRequest(req);
    return setupCORS(req, response);
  } catch (error) {
    logError("Unhandled error in dealer-auth function", error);
    return setupCORS(
      req,
      new Response(
        JSON.stringify({ 
          success: false, 
          error: "An unexpected error occurred in the authentication service" 
        }),
        { 
          status: 500, 
          headers: { "Content-Type": "application/json" } 
        }
      )
    );
  }
});
