
import { signIn } from '@/integrations/supabase/client';
import { DealerFormValues } from '@/schemas/dealerFormSchema';
import { createDealerWithDatabaseTransaction } from '../dealerProfileService';
import { invokeDealerFunction } from '../api/dealerApiClient';
import { validateEmail, validatePassword, checkAccountExists } from './validation';

export interface SignUpResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
  };
  error?: string;
  errorType?: 'email' | 'password' | 'server' | 'duplicate';
}

export async function signUpDealerWithEmail(values: DealerFormValues): Promise<SignUpResult> {
  console.log("Starting dealer signup process");
  
  // Validate email
  const emailValidation = validateEmail(values.email);
  if (!emailValidation.isValid) {
    return {
      success: false,
      error: emailValidation.error,
      errorType: 'email'
    };
  }

  // Validate password
  const passwordValidation = validatePassword(values.password);
  if (!passwordValidation.isValid) {
    return {
      success: false,
      error: passwordValidation.error,
      errorType: 'password'
    };
  }

  try {
    // Check if account exists
    const accountExists = await checkAccountExists(values.email);
    if (accountExists) {
      return {
        success: false,
        error: 'An account with this email already exists.',
        errorType: 'duplicate'
      };
    }

    // Try the new transactional approach first
    console.log("Attempting to create dealer using database transaction");
    const transactionResult = await createDealerWithDatabaseTransaction(values);
    
    if (transactionResult.success) {
      console.log("Dealer created successfully with transaction");
      
      // Auto sign-in the user after successful signup
      const { error: signInError } = await signIn.emailPassword({
        email: values.email,
        password: values.password
      });
      
      if (signInError) {
        console.warn("Auto sign-in failed after signup:", signInError);
      }
      
      return {
        success: true,
        user: {
          id: "transaction-created", // we don't have the actual ID but that's fine for now
          email: values.email
        }
      };
    }
    
    // Fall back to the edge function for registration if transaction failed
    console.log("Transaction approach failed, falling back to edge function");
    const response = await invokeDealerFunction('register', {
      email: values.email,
      password: values.password,
      supervisorName: values.supervisorName,
      companyName: values.companyName,
      taxId: values.taxId,
      businessRegistryNumber: values.businessRegistryNumber,
      companyAddress: values.companyAddress
    });

    if (!response.success) {
      console.error("Dealer registration failed:", response.error);
      return {
        success: false,
        error: response.error as string || 'Failed to create your account. Please try again.',
        errorType: 'server'
      };
    }

    const userData = response.data?.user;
    if (!userData || !userData.id) {
      console.error("Dealer registration returned invalid user data:", userData);
      return {
        success: false,
        error: 'Invalid user data returned from server',
        errorType: 'server'
      };
    }

    console.log("Dealer registration successful:", userData);
    return {
      success: true,
      user: {
        id: userData.id,
        email: userData.email
      }
    };

  } catch (error) {
    console.error("Unexpected error during dealer signup:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
      errorType: 'server'
    };
  }
}
