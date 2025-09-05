import { supabase } from "@/integrations/supabase/client";

interface ResetPasswordRequest {
  email: string;
  taxId: string;
  businessRegistryNumber: string;
  supervisorName: string;
  newPassword: string;
}

interface ResetPasswordResponse {
  success: boolean;
  error?: string;
  message?: string;
}

export async function resetPassword(data: ResetPasswordRequest): Promise<ResetPasswordResponse> {
  try {
    const { data: result, error } = await supabase.functions.invoke('password-recovery', {
      body: {
        email: data.email,
        taxId: data.taxId,
        businessRegistryNumber: data.businessRegistryNumber,
        supervisorName: data.supervisorName,
        newPassword: data.newPassword
      }
    });

    if (error) {
      console.error('Password reset error:', error);
      return {
        success: false,
        error: error.message || 'Password reset failed'
      };
    }

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Password reset failed'
      };
    }

    return {
      success: true,
      message: result.message || 'Password reset successfully'
    };
  } catch (error) {
    console.error('Password reset service error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.'
    };
  }
}