
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from "https://jspm.dev/uuid";
import { supabaseAdmin } from '../_shared/supabase-client.ts';
import { log, logError } from './logging.ts';
import { formatErrorResponse, formatSuccessResponse } from './response-utils.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// Initialize Supabase client with service role key for admin privileges
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Check if an email already exists in the system
 */
export async function checkEmailExists(req: Request, email: string) {
  try {
    log(`Checking if email exists: ${email}`);

    // Check in auth.users table using admin client
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers({
      filters: {
        email: email
      }
    });

    if (userError) {
      logError(`Error checking users: ${userError.message}`);
      throw new Error(`Failed to check user existence: ${userError.message}`);
    }

    const exists = userData && userData.users && userData.users.length > 0;
    log(`Email exists check result: ${exists}`);

    return formatSuccessResponse({
      exists: exists
    });
  } catch (error) {
    logError(`Error in checkEmailExists: ${error.message}`);
    return formatErrorResponse(error.message, 400);
  }
}

/**
 * Register a new dealer
 */
export async function register(req: Request, requestData: any) {
  try {
    log('Starting dealer registration process...');
    const { email, password, metadata } = requestData;

    if (!email || !password || !metadata?.name) {
      return formatErrorResponse('Email, password, and name are required', 400);
    }

    // Check if email already exists
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers({
      filters: {
        email: email
      }
    });

    if (userError) {
      logError(`Error checking existing user: ${userError.message}`);
      return formatErrorResponse(`Failed to check user existence: ${userError.message}`, 500);
    }

    if (userData && userData.users && userData.users.length > 0) {
      return formatErrorResponse('User with this email already exists', 400);
    }

    log('Email validation passed, creating user...');

    // Call the RPC function directly to create dealer with profile
    const { data: rpcResult, error: rpcError } = await supabase.rpc('create_dealer_with_profile', {
      p_email: email,
      p_password: password,
      p_supervisor_name: metadata.name,
      p_company_name: metadata.companyName || '',
      p_tax_id: metadata.taxId || '',
      p_business_registry_number: metadata.businessRegistryNumber || '',
      p_address: metadata.companyAddress || ''
    });

    log(`RPC function result: ${JSON.stringify(rpcResult)}, Error: ${rpcError?.message || 'None'}`);

    if (rpcError) {
      logError(`Error in creating dealer via RPC: ${rpcError.message}`);
      return formatErrorResponse(`Failed to create dealer: ${rpcError.message}`, 500);
    }

    if (!rpcResult || (typeof rpcResult === 'object' && !rpcResult.success)) {
      const errorMsg = (typeof rpcResult === 'object' && rpcResult.error) 
        ? rpcResult.error 
        : 'Failed to create dealer account';
      return formatErrorResponse(errorMsg, 500);
    }

    log('Dealer registration successful, sending welcome email...');

    // Send welcome email
    try {
      const welcomeEmailResponse = await fetch(`${SUPABASE_URL}/functions/v1/send-dealer-welcome`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_KEY}`
        },
        body: JSON.stringify({
          email: email,
          name: metadata.name
        })
      });

      log(`Welcome email response status: ${welcomeEmailResponse.status}`);
    } catch (emailError) {
      logError(`Failed to send welcome email: ${emailError.message}`);
      // Do not fail registration if email fails
    }

    return formatSuccessResponse({
      success: true,
      user: typeof rpcResult === 'object' ? rpcResult.user : null,
      message: "Registration successful. Please check your email for verification."
    });
  } catch (error) {
    logError(`Unexpected error in registration: ${error.message}`);
    return formatErrorResponse(`Registration failed: ${error.message}`, 500);
  }
}

/**
 * Create dealer profile
 */
export async function createDealerProfile(req: Request, requestData: any) {
  try {
    log('Creating dealer profile...');
    const { 
      userId, email, password, supervisorName, companyName, 
      companyAddress, taxId, businessRegistryNumber 
    } = requestData;

    if (!userId || !email || !supervisorName) {
      return formatErrorResponse('User ID, email and supervisor name are required', 400);
    }

    // Call the RPC function to create dealer profile
    const { data: rpcResult, error: rpcError } = await supabase.rpc('create_dealer_with_profile', {
      p_email: email,
      p_password: password || '',
      p_supervisor_name: supervisorName,
      p_company_name: companyName || '',
      p_tax_id: taxId || '',
      p_business_registry_number: businessRegistryNumber || '',
      p_address: companyAddress || ''
    });

    log(`Dealer profile creation result: ${JSON.stringify(rpcResult)}, Error: ${rpcError?.message || 'None'}`);

    if (rpcError) {
      logError(`Error creating dealer profile: ${rpcError.message}`);
      return formatErrorResponse(`Failed to create dealer profile: ${rpcError.message}`, 500);
    }

    return formatSuccessResponse({
      success: true,
      message: "Dealer profile created successfully"
    });
  } catch (error) {
    logError(`Error in createDealerProfile: ${error.message}`);
    return formatErrorResponse(`Failed to create dealer profile: ${error.message}`, 500);
  }
}

/**
 * Handler mapping to route actions to handler functions
 */
export const handlers = {
  'check-email-exists': checkEmailExists,
  'register': register,
  'create-dealer-profile': createDealerProfile,
};
