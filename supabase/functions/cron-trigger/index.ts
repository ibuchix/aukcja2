
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Cron job triggered");
    
    // The URL to your Supabase project's update-auction-outcomes function
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const functionUrl = `${supabaseUrl}/functions/v1/update-auction-outcomes`;
    
    // Call the function to update auction outcomes
    const response = await fetch(functionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""}`,
      },
    });
    
    const result = await response.json();
    console.log("Update auction outcomes result:", result);
    
    return new Response(
      JSON.stringify({ success: true, cron_executed: true, result }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error) {
    console.error("Error in cron trigger:", error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
