
import { supabase } from "@/integrations/supabase/client";
import { clearAuthStorage } from "./auth-utils";

/**
 * Creates a test account with consistent, simple credentials
 * This is used for troubleshooting authentication issues
 */
export async function createTestAccount() {
  try {
    // Clear any existing auth data
    clearAuthStorage();
    
    // Create a timestamp-based email for uniqueness
    const timestamp = new Date().getTime();
    const testEmail = `test.${timestamp}@example.com`;
    const testPassword = "TestPassword123!"; // Simple, consistent password
    
    console.log("Creating test account with email:", testEmail);
    
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
    
    // Sign out to clear any session
    await supabase.auth.signOut();
    
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
    // Clear any existing auth data
    clearAuthStorage();
    
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
    
    // Sign out after successful test
    await supabase.auth.signOut();
    
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
