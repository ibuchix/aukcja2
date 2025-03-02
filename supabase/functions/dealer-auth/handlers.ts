
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { logInfo, logError, logDebug } from "./logging.ts";
import { buildSuccessResponse, buildErrorResponse } from "./response-utils.ts";
import { UserMetadata, RegisterResponse } from "./types.ts";

// Initialize Supabase client with admin privileges
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function handleRequest(req: Request): Promise<Response> {
  try {
    // Parse request body
    const body = await req.json();
    const { action } = body;

    logInfo(`Processing ${action} request`);

    // Route to appropriate handler based on action
    switch (action) {
      case "register":
        return await handleRegister(body);
      case "login":
        return await handleLogin(body);
      case "checkEmailExists":
        return await handleCheckEmailExists(body);
      default:
        return buildErrorResponse(400, `Unsupported action: ${action}`);
    }
  } catch (error) {
    logError("Error processing request", error);
    return buildErrorResponse(500, "Failed to process request");
  }
}

async function handleRegister(body: any): Promise<Response> {
  try {
    const { email, password, metadata } = body;
    
    if (!email || !password) {
      return buildErrorResponse(400, "Email and password are required");
    }

    logDebug("Registration request received", { email, metadata });
    
    // Check if user already exists
    const { data: existingUsers, error: checkError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email.toLowerCase())
      .limit(1);
      
    if (checkError) {
      logError("Error checking for existing user", checkError);
    }
    
    if (existingUsers && existingUsers.length > 0) {
      return buildErrorResponse(409, "A user with this email already exists");
    }

    // Create user via direct SQL function call for atomic transaction
    const { data: result, error: funcError } = await supabase.rpc(
      "create_dealer_with_profile",
      {
        p_email: email.toLowerCase(),
        p_password: password,
        p_supervisor_name: metadata.name || "",
        p_company_name: metadata.companyName || "",
        p_tax_id: metadata.taxId || "",
        p_business_registry_number: metadata.businessRegistryNumber || "",
        p_address: metadata.companyAddress || ""
      }
    );

    if (funcError) {
      logError("Error in create_dealer_with_profile function", funcError);
      
      if (funcError.message?.includes("already exists")) {
        return buildErrorResponse(409, "A user with this email already exists");
      }
      
      return buildErrorResponse(500, `Registration failed: ${funcError.message}`);
    }

    // Check the result structure
    if (!result || typeof result !== 'object') {
      logError("Unexpected result from create_dealer_with_profile", { result });
      return buildErrorResponse(500, "Registration failed with invalid server response");
    }

    const parsedResult = result as any;
    
    if (!parsedResult.success) {
      logError("create_dealer_with_profile returned failure", parsedResult);
      return buildErrorResponse(
        500, 
        parsedResult.error || "Registration failed with unknown error"
      );
    }

    // Verify user was created and extract ID
    if (!parsedResult.user || !parsedResult.user.id) {
      logError("User created but ID missing from response", { parsedResult });
      return buildErrorResponse(500, "Registration partially completed but user data is incomplete");
    }

    const userId = parsedResult.user.id;
    logInfo("Dealer registered successfully", { userId });

    // Send verification email
    const { error: emailError } = await supabase.auth.admin.sendEmailInvite({
      email: email,
    });

    if (emailError) {
      logError("Failed to send verification email", emailError);
      // Continue despite email error - we'll let user know
    }

    const response: RegisterResponse = {
      success: true,
      user: {
        id: userId,
        email: email,
        user_metadata: metadata
      },
      message: emailError 
        ? "Account created successfully, but verification email could not be sent." 
        : "Registration successful. Please check your email for verification."
    };

    return buildSuccessResponse(response);
  } catch (error) {
    logError("Unexpected error in registration process", error);
    return buildErrorResponse(500, "Registration failed with server error");
  }
}

async function handleLogin(body: any): Promise<Response> {
  try {
    const { email, password } = body;
    
    if (!email || !password) {
      return buildErrorResponse(400, "Email and password are required");
    }

    logDebug("Login request received", { email });
    
    // Attempt to sign in user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (authError) {
      logError("Login failed", authError);
      return buildErrorResponse(401, "Invalid login credentials");
    }

    if (!authData.user || !authData.session) {
      logError("Login succeeded but missing user/session data");
      return buildErrorResponse(500, "Authentication succeeded but session data is incomplete");
    }

    // Get dealer profile details
    const { data: dealer, error: dealerError } = await supabase
      .from("dealers")
      .select("*")
      .eq("user_id", authData.user.id)
      .single();

    if (dealerError && dealerError.code !== "PGRST116") { // PGRST116 is "no rows returned"
      logError("Error fetching dealer profile", dealerError);
    }

    logInfo("User logged in successfully", { 
      userId: authData.user.id,
      hasProfile: !!dealer
    });

    return buildSuccessResponse({
      success: true,
      session: authData.session,
      dealer: dealer || null
    });
  } catch (error) {
    logError("Unexpected error in login process", error);
    return buildErrorResponse(500, "Login failed with server error");
  }
}

async function handleCheckEmailExists(body: any): Promise<Response> {
  try {
    const { email } = body;
    
    if (!email) {
      return buildErrorResponse(400, "Email is required");
    }

    // Check if user exists by email (case insensitive)
    const { data, error } = await supabase
      .from("users")
      .select("id")
      .ilike("email", email)
      .limit(1);
    
    if (error) {
      logError("Error checking email existence", error);
      return buildErrorResponse(500, "Failed to check if email exists");
    }

    const exists = data && data.length > 0;
    logInfo(`Email existence check: ${exists ? "exists" : "does not exist"}`);

    return buildSuccessResponse({ exists });
  } catch (error) {
    logError("Unexpected error checking email existence", error);
    return buildErrorResponse(500, "Email check failed with server error");
  }
}
