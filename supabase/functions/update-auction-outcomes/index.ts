import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createServiceClient } from "../_shared/supabase-client.ts";

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
    console.log("Starting auction processing function");
    
    const supabase = createServiceClient();
    const now = new Date().toISOString();

    console.log(`Current time (UTC): ${now}`);
    
    // Use the SECURITY DEFINER function (simplified approach)
    console.log("Calling secure auction processing function...");
    const { data: result, error: processError } = await supabase
      .rpc('process_ended_auctions_securely');
    
    if (processError) {
      console.error("SECURITY DEFINER function failed:", processError);
      throw new Error(`Auction processing failed: ${processError.message}`);
    }
    
    console.log("✅ Auction processing successful:", result);
    return new Response(
      JSON.stringify({
        success: true,
        method: 'security_definer',
        result: result,
        timestamp: now
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error("Error in auction processing:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);