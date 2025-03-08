
import { HttpError } from "../_shared/error-handling.ts";
import { create, verify } from "https://deno.land/x/djwt@v2.8/mod.ts";

/**
 * Generates a full set of tokens for client-side session creation
 */
export async function generateExchangeToken(userId: string, email: string) {
  console.log(`Generating auth tokens for user ${userId}`);
  
  try {
    // Get JWT secret
    const jwtSecret = Deno.env.get("JWT_SECRET");
    
    if (!jwtSecret) {
      throw new Error("Missing JWT secret");
    }
    
    // Get Supabase URL to extract project ref
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    if (!supabaseUrl) {
      throw new Error("Missing SUPABASE_URL");
    }
    
    // Extract project ref from Supabase URL
    const projectRef = supabaseUrl.match(/https:\/\/(.*?)\.supabase\.co/)?.[1];
    if (!projectRef) {
      throw new Error("Invalid SUPABASE_URL format");
    }
    
    console.log(`Using project ref: ${projectRef} for token generation`);
    
    // Generate a code verifier that Supabase can use as an auth_code
    // Instead of a custom JWT which requires a matching user, we'll generate a code
    // that can be exchanged through Supabase's OAuth-like flow
    const codeVerifier = crypto.randomUUID();
    
    // Create a simpler exchange token that combines the user ID and the code verifier
    // This will be used in a different way by the client
    const exchangeToken = {
      user_id: userId,
      email: email,
      code_verifier: codeVerifier
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
