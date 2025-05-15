
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
    
    // Prepare dealer profile data
    const dealerData = {
      email: testEmail,
      password: testPassword,
      supervisorName: "Test Supervisor",
      companyName: "Test Company Ltd",
      taxId: "1234567890",
      businessRegistryNumber: "123456789", // 9-digit REGON number
      companyAddress: "123 Test Street, Test City, 00-001",
      phoneNumber: "+48123456789",
      acceptTerms: true
    };
    
    // Use the create_dealer_with_profile RPC function to ensure both user and profile are created
    const { data: result, error } = await supabase.rpc('create_dealer_with_profile', {
      p_email: dealerData.email,
      p_password: dealerData.password,
      p_supervisor_name: dealerData.supervisorName,
      p_company_name: dealerData.companyName,
      p_tax_id: dealerData.taxId,
      p_business_registry_number: dealerData.businessRegistryNumber,
      p_address: dealerData.companyAddress,
      p_phone_number: dealerData.phoneNumber
    });
    
    if (error) {
      console.error("Error creating test account:", error);
      return {
        success: false,
        error: error.message
      };
    }
    
    // Parse the response if needed
    const parsedResult = typeof result === 'string' ? JSON.parse(result) : result;
    
    if (!parsedResult?.success) {
      console.error("Failed to create test account:", parsedResult?.error || "Unknown error");
      return {
        success: false,
        error: parsedResult?.error || "Failed to create test user account"
      };
    }
    
    // Success - get the user ID from the result
    const userId = parsedResult.user?.id;
    if (!userId) {
      console.error("No user ID returned when creating test account");
      return {
        success: false,
        error: "Failed to get user ID"
      };
    }
    
    return {
      success: true,
      email: testEmail,
      password: testPassword,
      user: parsedResult.user
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
