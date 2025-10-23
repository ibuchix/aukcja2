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
  tokenForDev?: string;
}

export async function requestPasswordReset(data: Omit<ResetPasswordRequest, 'newPassword'>): Promise<ResetPasswordResponse> {
  try {
    const { data: result, error } = await supabase.functions.invoke('dealer-auth', {
      body: {
        action: 'password_reset_request',
        email: data.email,
        taxId: data.taxId,
        businessRegistryNumber: data.businessRegistryNumber,
        supervisorName: data.supervisorName
      }
    });

    if (error) {
      console.error('Password reset request error:', error);
      return {
        success: false,
        error: error.message || 'Password reset request failed'
      };
    }

    return {
      success: true,
      message: result.message || 'If your account exists, you will receive a password reset email.',
      tokenForDev: result.tokenForDev
    };
  } catch (error) {
    console.error('Password reset request service error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.'
    };
  }
}

export async function confirmPasswordReset(token: string, newPassword: string): Promise<ResetPasswordResponse> {
  try {
    const { data: result, error } = await supabase.functions.invoke('dealer-auth', {
      body: {
        action: 'password_reset_confirm',
        token,
        newPassword
      }
    });

    if (error) {
      console.error('Password reset confirmation error:', error);
      return {
        success: false,
        error: error.message || 'Password reset failed'
      };
    }

    return {
      success: true,
      message: result.message || 'Password has been reset successfully'
    };
  } catch (error) {
    console.error('Password reset confirmation service error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.'
    };
  }
}

// Legacy function for backward compatibility
export async function resetPassword(data: ResetPasswordRequest): Promise<ResetPasswordResponse> {
  return requestPasswordReset(data);
}