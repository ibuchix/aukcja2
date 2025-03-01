
import { supabase } from "@/integrations/supabase/client";

export const checkEmailExists = async (email: string): Promise<boolean> => {
  try {
    // Instead of using a function, directly check if the email exists
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
      }
    });

    // If there's no error and data exists, the email exists
    return !error && !!data;
  } catch (error) {
    console.error("Error checking email:", error);
    return false;
  }
};

export const cleanupFailedRegistration = async (userId: string): Promise<void> => {
  try {
    // Instead of using a function, directly delete the user if needed
    // Note: This might require admin privileges, so it might fail
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) {
      console.error("Error cleaning up failed registration:", error);
    }
  } catch (error) {
    console.error("Error cleaning up failed registration:", error);
  }
};
