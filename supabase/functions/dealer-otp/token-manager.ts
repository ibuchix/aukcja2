
import { HttpError } from "../_shared/error-handling.ts";

/**
 * Generates a simplified exchange token for client-side session creation
 * Instead of trying to create a full JWT, we'll just use a simple JSON object
 * that can be used by the client to request a magic link
 */
export async function generateExchangeToken(userId: string, email: string) {
  console.log(`Generating exchange token for user ${userId}`);
  
  try {
    // Generate a simple exchange token with just the user ID and email
    // No need for a complex JWT that might not be compatible with Supabase's auth
    const exchangeToken = {
      user_id: userId,
      email: email
    };
    
    console.log("Auth exchange data generated successfully");
    return {
      exchangeToken: JSON.stringify(exchangeToken)
    };
  } catch (error) {
    console.error("Token generation failed:", error);
    throw new HttpError(`Failed to generate token: ${error.message || 'Unknown error'}`, 500);
  }
}
