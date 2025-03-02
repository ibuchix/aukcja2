
import { DealerFormValues } from "@/schemas/dealerFormSchema";
import { createDealerProfile } from "@/services/dealer/dealerProfileCreationService";
import { SignupResult } from "./types";

export async function handleProfileCreation(
  userId: string | undefined,
  values: DealerFormValues
): Promise<SignupResult> {
  // Skip profile creation if userId is missing - don't show error to user
  // The user account has been created already, and they can log in
  if (!userId) {
    console.warn("User ID not returned from registration, but auth account was created");
    return {
      success: true,
      message: "Your account has been created successfully. Please check your email for verification."
    };
  }

  try {
    const profileResult = await createDealerProfile(userId, values);

    if (!profileResult.success) {
      // Enhanced network error detection
      if (
        profileResult.errorType === 'network' ||
        profileResult.error?.includes('network') ||
        profileResult.error?.includes('timeout') ||
        profileResult.error?.includes('unavailable')
      ) {
        console.error("Network error during profile creation:", profileResult.error);
        return {
          success: false,
          error: "Network issue while creating dealer profile. Please try again.",
          errorType: 'network',
          userId: userId
        };
      }

      // We still created the user, so return partial success
      return {
        success: true,
        partialSuccess: true,
        warning: profileResult.error || "Profile creation had issues",
        message: "Your account has been created, but profile setup will need to be completed later.",
        userId: userId
      };
    }

    return {
      success: true,
      message: "Registration successful. Please check your email for verification.",
      userId: userId
    };
  } catch (error) {
    console.error("Error during profile creation:", error);
    return {
      success: true,
      partialSuccess: true,
      warning: error instanceof Error ? error.message : "Unknown error during profile creation",
      message: "Your account has been created, but profile setup will need to be completed later.",
      userId: userId
    };
  }
}
