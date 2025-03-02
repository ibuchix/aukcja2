
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";
import { respondSuccess, respondError } from "./response-utils.ts";
import { logInfo, logError, logWarning } from "./logging.ts";

// Initialize the Supabase client with service role for admin operations
const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

type RegistrationMetadata = {
  name: string;
  companyName?: string;
  taxId?: string;
  businessRegistryNumber?: string;
  companyAddress?: string;
  phoneNumber?: string;
};

/**
 * Handle dealer registration
 */
export async function handleDealerRegister(
  body: any,
  requestId: string
): Promise<Response> {
  try {
    const { email, password, metadata = {} } = body;
    
    logInfo(`Processing registration for email: ${email}, request ID: ${requestId}`);

    if (!email || !password) {
      return respondError("Email and password are required", 400);
    }

    // Validate required metadata
    if (!metadata.name) {
      return respondError("Name is required in metadata", 400);
    }

    // Sanitize and prepare metadata
    const cleanedMetadata = sanitizeMetadata(metadata);

    // Check if email already exists
    const { data: existsData, error: existsError } = await supabaseAdmin.rpc(
      "check_email_exists",
      { email_to_check: email.toLowerCase().trim() }
    );

    if (existsError) {
      logError("Error checking if email exists", existsError);
      // Continue despite this error - the procedure will check again
    } else if (existsData?.exists) {
      return respondError("Email already exists", 409);
    }

    // Call the improved stored procedure to handle the dealer registration
    const { data: result, error: rpcError } = await supabaseAdmin.rpc(
      "create_dealer_with_profile",
      {
        p_email: email.toLowerCase().trim(),
        p_password: password,
        p_supervisor_name: cleanedMetadata.name,
        p_company_name: cleanedMetadata.companyName || cleanedMetadata.name,
        p_tax_id: cleanedMetadata.taxId || "",
        p_business_registry_number: cleanedMetadata.businessRegistryNumber || "",
        p_address: cleanedMetadata.companyAddress || "",
        p_phone_number: cleanedMetadata.phoneNumber || ""
      }
    );

    if (rpcError) {
      logError(`RPC error during registration (request ID: ${requestId})`, rpcError);
      
      // Check for duplicate key errors
      if (rpcError.message?.includes("duplicate") || 
          rpcError.message?.includes("already exists") ||
          rpcError.message?.toLowerCase().includes("unique violation")) {
        if (rpcError.message?.includes("email")) {
          return respondError("An account with this email already exists", 409);
        }
        if (rpcError.message?.toLowerCase().includes("tax_id")) {
          return respondError("This tax ID is already registered", 409);
        }
        if (rpcError.message?.toLowerCase().includes("business_registry_number")) {
          return respondError("This business registry number is already registered", 409);
        }
        return respondError("A duplicate entry was detected", 409);
      }
      
      // Internal server errors
      return respondError(
        `Registration failed: ${rpcError.message}`,
        500
      );
    }

    if (!result) {
      logError(`Empty result from registration RPC (request ID: ${requestId})`, null);
      return respondError("Registration failed with no result", 500);
    }

    if (!result.success) {
      logError(`Registration unsuccessful (request ID: ${requestId})`, result);
      return respondError(
        result.error || "Registration failed for unknown reason",
        result.error_code === "unique_violation" ? 409 : 500
      );
    }

    // Check for warnings (partial success)
    if (result.warning) {
      logWarning(`Registration partial success (request ID: ${requestId}): ${result.warning}`);
      
      // Return partial success response
      return respondSuccess({
        success: true,
        partialSuccess: true,
        warning: result.warning,
        userId: result.user?.id,
        message: "Account created but with some limitations. You may need to complete profile setup."
      });
    }

    // Successfully created user
    logInfo(`User registered successfully (request ID: ${requestId}): ${result.user?.id}`);
    
    return respondSuccess({
      success: true,
      userId: result.user?.id,
      message: "Registration successful. Please check your email for verification."
    });
  } catch (error) {
    logError(`Unexpected error in registration handler (request ID: ${requestId})`, error);
    return respondError(
      `Registration failed unexpectedly: ${error.message}`,
      500
    );
  }
}

/**
 * Sanitize and validate registration metadata
 */
function sanitizeMetadata(metadata: any): RegistrationMetadata {
  return {
    name: sanitizeString(metadata.name),
    companyName: sanitizeString(metadata.companyName),
    taxId: sanitizeString(metadata.taxId),
    businessRegistryNumber: sanitizeString(metadata.businessRegistryNumber),
    companyAddress: sanitizeString(metadata.companyAddress),
    phoneNumber: sanitizeString(metadata.phoneNumber)
  };
}

/**
 * Sanitize a string value
 */
function sanitizeString(value: any): string {
  if (typeof value !== "string") return "";
  return value.trim();
}
