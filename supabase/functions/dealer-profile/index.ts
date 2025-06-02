
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper function to safely parse JSON
async function safeJsonParse(req: Request): Promise<any> {
  try {
    const text = await req.text();
    console.log("Raw request body:", text);
    
    if (!text || text.trim() === '') {
      console.log("Empty request body received");
      return null;
    }
    
    return JSON.parse(text);
  } catch (error) {
    console.error("JSON parse error:", error);
    throw new Error("Invalid JSON in request body");
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const url = new URL(req.url);
  const path = url.pathname.split("/").pop();

  console.log(`Request method: ${req.method}, path: ${path}`);

  try {
    // Handle specific endpoints
    if (path === "update-profile") {
      return handleUpdateProfile(req, supabase);
    } else if (path === "upload-document") {
      return handleDocumentUpload(req, supabase);
    } else if (path === "get-documents") {
      return handleGetDocuments(req, supabase);
    } else {
      return new Response(
        JSON.stringify({ error: "Endpoint not found" }),
        { 
          status: 404, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders 
          } 
        }
      );
    }
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders 
        } 
      }
    );
  }
});

// Handle profile updates
async function handleUpdateProfile(req: Request, supabase: any) {
  try {
    const body = await safeJsonParse(req);
    
    if (!body) {
      return new Response(
        JSON.stringify({ error: "Request body is required" }),
        { 
          status: 400, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders 
          } 
        }
      );
    }

    const { token, dealerData } = body;

    if (!token || !dealerData) {
      return new Response(
        JSON.stringify({ error: "Token and dealerData are required" }),
        { 
          status: 400, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders 
          } 
        }
      );
    }

    // Verify token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { 
          status: 401, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders 
          } 
        }
      );
    }

    // Call the RPC function to update the profile
    const { data, error } = await supabase.rpc("update_dealer_profile", {
      p_user_id: user.id,
      p_supervisor_name: dealerData.supervisorName,
      p_dealership_name: dealerData.dealershipName,
      p_address: dealerData.address,
      p_phone_number: dealerData.phoneNumber || null
    });

    if (error) throw error;

    return new Response(
      JSON.stringify(data),
      { 
        status: 200, 
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders 
        } 
      }
    );
  } catch (error) {
    console.error("Error updating profile:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders 
        } 
      }
    );
  }
}

// Handle document uploads
async function handleDocumentUpload(req: Request, supabase: any) {
  try {
    // We need to handle form data for file uploads
    const formData = await req.formData();
    const file = formData.get("file");
    const documentType = formData.get("documentType");
    const token = formData.get("token");

    if (!file || !documentType || !token) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { 
          status: 400, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders 
          } 
        }
      );
    }

    // Verify token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { 
          status: 401, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders 
          } 
        }
      );
    }

    // Get dealer ID from user
    const { data: dealerData, error: dealerError } = await supabase
      .from("dealers")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (dealerError || !dealerData) {
      console.error("Error fetching dealer:", dealerError);
      return new Response(
        JSON.stringify({ error: "Dealer profile not found" }),
        { 
          status: 404, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders 
          } 
        }
      );
    }

    // Clean filename to avoid issues
    const fileName = (file as File).name.replace(/[^\x00-\x7F]/g, '');
    const fileExt = fileName.split('.').pop();
    const timestamp = new Date().toISOString().replace(/[-:.]/g, '');
    const randomId = Math.random().toString(36).substring(2, 10);
    const filePath = `${user.id}/${documentType}-${timestamp}-${randomId}.${fileExt}`;

    // Upload file to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("dealer-documents")
      .upload(filePath, file, {
        contentType: (file as File).type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw uploadError;
    }

    // Save document reference in the database
    const { data: docData, error: docError } = await supabase
      .from("dealer_documents")
      .insert({
        dealer_id: dealerData.id,
        file_path: filePath,
        file_name: fileName,
        file_type: (file as File).type,
        document_type: documentType,
      })
      .select()
      .single();

    if (docError) {
      console.error("Document insert error:", docError);
      throw docError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        document: docData 
      }),
      { 
        status: 200, 
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders 
        } 
      }
    );
  } catch (error) {
    console.error("Error uploading document:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders 
        } 
      }
    );
  }
}

// Handle getting documents
async function handleGetDocuments(req: Request, supabase: any) {
  try {
    let token;
    
    console.log(`Get documents request method: ${req.method}`);
    
    // Handle both GET and POST requests with better error handling
    if (req.method === "GET") {
      const url = new URL(req.url);
      token = url.searchParams.get("token");
      console.log("GET request - token from query params:", token ? "present" : "missing");
    } else if (req.method === "POST") {
      try {
        const body = await safeJsonParse(req);
        console.log("POST request - parsed body:", body ? "present" : "missing");
        
        if (body && typeof body === 'object') {
          token = body.token;
          console.log("POST request - token from body:", token ? "present" : "missing");
        }
      } catch (parseError) {
        console.error("Error parsing POST body:", parseError);
        return new Response(
          JSON.stringify({ error: "Invalid request body format" }),
          { 
            status: 400, 
            headers: { 
              "Content-Type": "application/json",
              ...corsHeaders 
            } 
          }
        );
      }
    }

    if (!token) {
      console.error("No token provided in request");
      return new Response(
        JSON.stringify({ error: "Token is required" }),
        { 
          status: 400, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders 
          } 
        }
      );
    }

    // Verify token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { 
          status: 401, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders 
          } 
        }
      );
    }

    console.log("User authenticated successfully:", user.id);

    // Get dealer ID from user
    const { data: dealerData, error: dealerError } = await supabase
      .from("dealers")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (dealerError || !dealerData) {
      console.error("Error fetching dealer:", dealerError);
      return new Response(
        JSON.stringify({ error: "Dealer profile not found" }),
        { 
          status: 404, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders 
          } 
        }
      );
    }

    console.log("Dealer found:", dealerData.id);

    // Get all documents for this dealer
    const { data: documents, error: docsError } = await supabase
      .from("dealer_documents")
      .select("*")
      .eq("dealer_id", dealerData.id)
      .order("uploaded_at", { ascending: false });

    if (docsError) {
      console.error("Error fetching documents:", docsError);
      throw docsError;
    }

    console.log("Documents fetched:", documents?.length || 0);

    // For each document, get the signed URL
    const documentsWithUrls = await Promise.all(
      (documents || []).map(async (doc: any) => {
        const { data: urlData } = await supabase.storage
          .from("dealer-documents")
          .createSignedUrl(doc.file_path, 3600); // 1 hour expiry

        return {
          ...doc,
          signedUrl: urlData?.signedUrl || null
        };
      })
    );

    return new Response(
      JSON.stringify({ 
        success: true, 
        documents: documentsWithUrls 
      }),
      { 
        status: 200, 
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders 
        } 
      }
    );
  } catch (error) {
    console.error("Error fetching documents:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders 
        } 
      }
    );
  }
}
