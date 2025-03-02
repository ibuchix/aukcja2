
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { logDebug, logError, logInfo } from "./logging.ts";
import { errorResponse, successResponse, authErrorResponse } from "./response-utils.ts";

// Initialize Supabase client with environment variables
const supabaseClient = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

/**
 * Handle user registration
 */
export async function handleRegister(request: any) {
  try {
    const { email, password, metadata } = request;
    
    logInfo("Processing registration request", { email });
    
    // Validate required fields
    if (!email || !password) {
      return errorResponse("Email and password are required", "validation_error");
    }
    
    if (!metadata || !metadata.name) {
      return errorResponse("Name is required", "validation_error");
    }
    
    // Check if email already exists
    const { data: existingUsers, error: checkError } = await supabaseClient
      .from("auth.users")
      .select("id")
      .eq("email", email)
      .limit(1);
      
    if (checkError) {
      logError("Error checking existing user", { error: checkError });
      return errorResponse("Error checking user existence", "database_error");
    }
    
    if (existingUsers && existingUsers.length > 0) {
      return errorResponse("Email already in use", "validation_error");
    }
    
    // Create user with provided metadata
    const { data, error } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: metadata
    });
    
    if (error) {
      logError("Error creating user", { error });
      return errorResponse(error.message, "auth_error");
    }
    
    logInfo("User registered successfully", { userId: data.user.id });
    
    return successResponse({
      user: data.user,
      message: "Registration successful"
    });
  } catch (error) {
    logError("Unexpected error in registration", { error });
    return errorResponse("Registration failed with an unexpected error");
  }
}

/**
 * Handle user login
 */
export async function handleLogin(request: any) {
  try {
    const { email, password } = request;
    
    logInfo("Processing login request", { email });
    
    // Validate required fields
    if (!email || !password) {
      return errorResponse("Email and password are required", "validation_error");
    }
    
    // Authenticate user
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      logError("Login error", { error });
      return authErrorResponse(error.message);
    }
    
    // Fetch dealer profile
    const { data: dealer, error: profileError } = await supabaseClient
      .from("dealers")
      .select("*")
      .eq("user_id", data.user.id)
      .single();
      
    if (profileError && profileError.code !== "PGRST116") { // Not "found"
      logError("Error fetching dealer profile", { error: profileError });
    }
    
    logInfo("User logged in successfully", { userId: data.user.id });
    
    return successResponse({
      session: data.session,
      dealer: dealer || null
    });
  } catch (error) {
    logError("Unexpected error in login", { error });
    return errorResponse("Login failed with an unexpected error");
  }
}

/**
 * Handle email existence check
 */
export async function handleEmailCheck(request: any) {
  try {
    const { email } = request;
    
    if (!email) {
      return errorResponse("Email is required", "validation_error");
    }
    
    logInfo("Checking email existence", { email });
    
    // Call the check_email_exists RPC function
    const { data, error } = await supabaseClient.rpc("check_email_exists", {
      p_email: email
    });
    
    if (error) {
      logError("Error checking email existence", { error });
      return errorResponse("Error checking email", "database_error");
    }
    
    return successResponse({
      exists: data.exists
    });
  } catch (error) {
    logError("Unexpected error checking email", { error });
    return errorResponse("Email check failed with an unexpected error");
  }
}
