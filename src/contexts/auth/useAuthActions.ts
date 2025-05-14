import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { Profile } from '@/types/profile';
import { validateFormData } from '@/utils/validation/formValidation';

interface AuthActionResult {
  success: boolean;
  error?: string;
  user?: any;
  session?: any;
}

interface UseAuthActionsReturn {
  signUp: ({ email, password, options }: { email: string; password: string; options?: any }) => Promise<AuthActionResult>;
  signIn: ({ email, password, redirectTo }: { email: string; password: string; redirectTo?: string }) => Promise<AuthActionResult>;
  signOut: () => Promise<boolean>;
  updateUser: (data: any) => Promise<AuthActionResult>;
  resetPassword: (email: string) => Promise<AuthActionResult>;
  getUserProfile: () => Promise<Profile | null>;
}

/**
 * Function to safely handle profile data response with type checking
 */
export const safeGetProfileData = (profileData: any): Profile => {
  // If there's an error or profileData is null, return a default profile
  if (!profileData || profileData?.error) {
    // Cast to unknown first, then to Profile to avoid direct type assertion
    return {
      id: '',
      role: 'dealer',
      updated_at: new Date().toISOString(),
      suspended: false
    };
  }

  // If it's a valid profile, return it
  return profileData as Profile;
};

export const useAuthActions = (): UseAuthActionsReturn => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const signUp = async ({ email, password, options = {} }: { email: string; password: string; options?: any }): Promise<AuthActionResult> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options,
      });

      if (error) {
        toast({
          title: "Sign-up failed",
          description: error.message,
          variant: "destructive",
        });
        return { success: false, error: error.message };
      }

      toast({
        title: "Sign-up successful",
        description: "Please check your email to verify your account.",
      });
      return { success: true, user: data.user };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      toast({
        title: "Sign-up failed",
        description: errorMessage,
        variant: "destructive",
      });
      return { success: false, error: errorMessage };
    }
  };

  // Fix the comparison in the signIn function
  const signIn = async ({ email, password, redirectTo }: { email: string; password: string; redirectTo?: string }) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      // Check if the response has a user and session
      if (data && data.user && data.session) {
        // Success case - explicitly check for properties rather than comparing with boolean
        return {
          success: true,
          user: data.user,
          session: data.session
        };
      } else {
        return {
          success: false,
          error: "Authentication failed"
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to sign in";
      return {
        success: false,
        error: errorMessage
      };
    }
  };

  const signOut = async (): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        toast({
          title: "Sign out failed",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
      navigate('/auth');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      toast({
        title: "Sign out failed",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  };

  const updateUser = async (data: any): Promise<AuthActionResult> => {
    try {
      const { data: response, error } = await supabase.auth.updateUser(data);

      if (error) {
        toast({
          title: "Update failed",
          description: error.message,
          variant: "destructive",
        });
        return { success: false, error: error.message };
      }

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      return { success: true, user: response };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      toast({
        title: "Update failed",
        description: errorMessage,
        variant: "destructive",
      });
      return { success: false, error: errorMessage };
    }
  };

  const resetPassword = async (email: string): Promise<AuthActionResult> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) {
        toast({
          title: "Password reset failed",
          description: error.message,
          variant: "destructive",
        });
        return { success: false, error: error.message };
      }

      toast({
        title: "Password reset email sent",
        description: "Please check your email to reset your password.",
      });
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      toast({
        title: "Password reset failed",
        description: errorMessage,
        variant: "destructive",
      });
      return { success: false, error: errorMessage };
    }
  };

  const getUserProfile = useCallback(async (): Promise<Profile | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        console.warn('No user found, ensure user is logged in.');
        return null;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        return null;
      }

      // Safely get profile data
      const profile = safeGetProfileData(profileData);
      return profile;

    } catch (error) {
      console.error('Error in getUserProfile:', error);
      return null;
    }
  }, []);

  return {
    signUp,
    signIn,
    signOut,
    updateUser,
    resetPassword,
    getUserProfile,
  };
};
