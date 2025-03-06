
import { HttpError } from "../_shared/error-handling.ts";
import { create, verify } from "https://deno.land/x/djwt@v2.8/mod.ts";

/**
 * Generates a temporary exchange token for client-side session creation
 */
export async function generateExchangeToken(userId: string, email: string) {
  console.log(`Generating exchange token for user ${userId}`);
  
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
    
    // Create a key for signing from the JWT secret
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(jwtSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    
    // Current timestamp in seconds
    const now = Math.floor(Date.now() / 1000);
    
    // Create a token with the proper claims for Supabase Auth
    const exchangeToken = await create(
      { 
        alg: "HS256", 
        typ: "JWT" 
      },
      { 
        sub: userId,
        email: email,
        role: "authenticated",
        aud: projectRef,   // Set audience to the project ref
        iat: now,          // Issued at time
        exp: now + 300,    // 5 minute expiry
        type: "dealer-exchange-token"
      },
      key
    );
    
    console.log("Exchange token generated successfully");
    return exchangeToken;
    
  } catch (error) {
    console.error("Exchange token generation failed:", error);
    throw new HttpError(`Failed to generate token: ${error.message || 'Unknown error'}`, 500);
  }
}
