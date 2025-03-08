
import { HttpError } from "../_shared/error-handling.ts";
import { createServiceClient } from "../_shared/supabase-client.ts";

/**
 * Generates a simplified exchange token for client-side session creation
 * Instead of trying to create a full JWT, we'll just use a simple JSON object
 * that can be used by the client for direct sign-in
 */
export async function generateExchangeToken(userId: string, email: string) {
  console.log(`Generating exchange token for user ${userId}`);
  
  try {
    // Create a service client with admin privileges
    const supabaseAdmin = createServiceClient();
    
    // Generate a sign-in link for the user with admin privileges
    console.log(`Creating sign-in link for user ${userId}`);
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
    });
    
    if (error) {
      console.error("Error generating auth link:", error);
      throw new HttpError(`Failed to generate auth link: ${error.message}`, 500);
    }
    
    if (!data || !data.properties) {
      console.error("No data returned from generateLink");
      throw new HttpError("Failed to generate auth data", 500);
    }
    
    console.log("Auth link generated successfully");
    
    // Extract just what we need for the client
    const exchangeToken = {
      user_id: userId,
      email: email,
      properties: {
        hashed_token: data.properties.hashed_token,
        email_otp: data.properties.email_otp
      }
    };
    
    return {
      exchangeToken: JSON.stringify(exchangeToken)
    };
  } catch (error) {
    console.error("Token generation failed:", error);
    throw new HttpError(`Failed to generate token: ${error.message || 'Unknown error'}`, 500);
  }
}
