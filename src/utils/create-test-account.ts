
import { supabase } from "@/integrations/supabase/client";
import { clearAuthStorage } from "./auth-utils";

/**
 * Creates a test account with consistent, simple credentials
 * This is used for troubleshooting authentication issues
 */
export async function createTestAccount() {
  try {
    // Clear any existing auth data to start fresh
    clearAuthStorage();
    
    // Create a timestamp-based email for uniqueness
    const timestamp = new Date().getTime();
    const testEmail = `test.${timestamp}@example.com`;
    
    // Create a stronger password that meets all validation requirements
    // It includes uppercase, lowercase, numbers, and is at least 8 chars
    const testPassword = `Test${timestamp.toString().slice(-4)}Pa$$w0rd!`;
    
    console.log("Creating test account with email:", testEmail);
    console.log("Using password:", testPassword);
    
    // Create user with direct Supabase auth call
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          role: 'dealer',
          name: 'Test User'
        }
      }
    });
    
    if (error) {
      console.error("Error creating test account:", error);
      return {
        success: false,
        error: error.message
      };
    }
    
    // DO NOT sign out after account creation - removed this line:
    // await supabase.auth.signOut();
    
    return {
      success: true,
      email: testEmail,
      password: testPassword,
      user: data.user
    };
  } catch (error) {
    console.error("Exception creating test account:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Tests login with the specified credentials
 */
export async function testLogin(email: string, password: string) {
  try {
    console.log("Testing login with email:", email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });
    
    if (error) {
      console.error("Test login failed:", error);
      return {
        success: false,
        error: error.message
      };
    }
    
    return {
      success: true,
      user: data.user
    };
  } catch (error) {
    console.error("Exception during test login:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
