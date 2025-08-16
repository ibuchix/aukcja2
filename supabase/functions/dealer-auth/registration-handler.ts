
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { respondSuccess, respondError } from "./response-utils.ts";
import { logInfo, logError, logWarning, logDebug } from "./logging.ts";
import { preparePassword } from "./password-utils.ts";
import { sanitizeMetadata, sanitizeString } from "./sanitization-utils.ts";

// Initialize the Supabase client with service role for admin operations
const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        // Ensure correct case for headers
        'Authorization': `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        'apikey': Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
      }
    }
  }
);

type RegistrationMetadata = {
  name: string;
  companyName?: string;
  taxId?: string;
  businessRegistryNumber?: string;
  companyAddress?: string;
  phoneNumber?: string;
};

/**
 * Check if an email exists as a dealer with complete registration handling
 */
export async function handleCheckDealerEmail(
  body: any,
  requestId: string
): Promise<Response> {
  try {
    const { email } = body;
    
    if (!email) {
      return respondError("Email is required", 400);
    }

    const sanitizedEmail = sanitizeString(email).toLowerCase();
    
    // First check if we have a complete dealer registration
    const { data: completionCheck, error: completionError } = await supabaseAdmin
      .from('dealers')
      .select('id, user_id, verification_status')
      .eq('user_id', (
        await supabaseAdmin.auth.admin.listUsers({
          filter: `email.eq.${sanitizedEmail}`
        })
      ).data.users[0]?.id || '')
      .single();
    
    if (!completionError && completionCheck) {
      // Complete dealer registration exists
      logInfo(`Complete dealer registration found for ${sanitizedEmail}`);
      return respondSuccess({ 
        exists: true, 
        complete: true,
        message: "Dealer account already fully registered" 
      });
    }
    
    // Use role-specific check for partial registrations
    const { data, error } = await supabaseAdmin.rpc(
      "check_email_exists_for_dealer_role",
      { p_email: sanitizedEmail }
    );

    if (error) {
      logError(`Error checking dealer email (request ID: ${requestId})`, error);
      return respondError(`Error checking email: ${error.message}`, 500);
    }

    return respondSuccess(data);
  } catch (error) {
    logError(`Unexpected error in email check handler (request ID: ${requestId})`, error);
    return respondError(
      `Email check failed unexpectedly: ${error.message}`,
      500
    );
  }
}

/**
 * Handle dealer registration
 */
export async function handleDealerRegister(
  body: any,
  requestId: string
): Promise<Response> {
  try {
    const { email, password, metadata = {}, passwordless = false } = body;
    
    logInfo(`Processing registration for email: ${email}, passwordless: ${passwordless}, request ID: ${requestId}`);

    if (!email) {
      return respondError("Email is required", 400);
    }

    if (!password) {
      return respondError("Password is required for dealer registration", 400);
    }

    // Validate required metadata
    if (!metadata.name) {
      return respondError("Name is required in metadata", 400);
    }

    // Sanitize and prepare metadata
    const cleanedMetadata = sanitizeMetadata(metadata);
    const sanitizedEmail = sanitizeString(email).toLowerCase();
    const dealershipName = cleanedMetadata.companyName || cleanedMetadata.name;

    // EARLY SUCCESS CHECK: Check if complete dealer registration already exists
    try {
      // First, get user by email
      const { data: userList, error: userListError } = await supabaseAdmin.auth.admin.listUsers({
        filter: `email.eq.${sanitizedEmail}`
      });
      
      if (!userListError && userList?.users?.length > 0) {
        const existingUser = userList.users[0];
        
        // Check if dealer profile exists with matching dealership name
        const { data: dealerProfile, error: dealerError } = await supabaseAdmin
          .from('dealers')
          .select('id, dealership_name, verification_status')
          .eq('user_id', existingUser.id)
          .eq('dealership_name', dealershipName)
          .single();
        
        if (!dealerError && dealerProfile) {
          // Complete dealer registration exists with exact match - immediate success
          logInfo(`Complete dealer registration found for ${email} with dealership ${dealershipName}, treating as successful retry`);
          
          return respondSuccess({
            success: true,
            userId: existingUser.id,
            existingUser: true,
            message: "Registration completed successfully. Please log in to your account."
          });
        }
      }
    } catch (earlyCheckError) {
      logWarning("Error during early success check, continuing with normal flow", earlyCheckError);
    }

    // Continue with new registration process since no existing complete registration found

    // Normalize password with our standardized function
    const normalizedPassword = preparePassword(password);
    logDebug("Password normalization complete", { 
      originalLength: password.length, 
      normalizedLength: normalizedPassword.length,
      // Log first and last character code for debugging (without revealing the actual password)
      firstCharCode: normalizedPassword.charCodeAt(0),
      lastCharCode: normalizedPassword.charCodeAt(normalizedPassword.length - 1)
    });

    // Normalize phone number by removing spaces and ensuring it starts with +
    const normalizedPhone = cleanedMetadata.phoneNumber || "";
    const formattedPhone = normalizedPhone.replace(/\s+/g, '');
    const phoneWithCode = formattedPhone.startsWith('+') ? formattedPhone : `+${formattedPhone}`;

    // Check if user already exists but doesn't have dealer role
    const { data: userCheck, error: userCheckError } = await supabaseAdmin.rpc(
      "check_email_exists_for_dealer_role",
      { p_email: sanitizedEmail }
    );
    
    let userId: string;
    let existingUser = false;
    
    if (userCheck?.email_registered && !userCheck?.exists) {
      // User exists but not as dealer - get their ID
      logInfo(`User exists but not as dealer: ${email}`);
      existingUser = true;
      
      // Get existing user ID
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(
        userCheck?.user_id
      );
      
      if (userError || !userData?.user) {
        logError(`Error getting existing user (request ID: ${requestId})`, userError);
        return respondError("Error retrieving existing user", 500);
      }
      
      userId = userData.user.id;
    } else {
      // Use direct admin API to create user with confirmed email
      // This avoids the need for email verification
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
        email: sanitizeString(email).toLowerCase(),
        password: normalizedPassword,
        email_confirm: true, // Explicitly confirm email
        user_metadata: {
          name: cleanedMetadata.name,
          role: 'dealer'
        },
        phone: phoneWithCode || undefined
      });

      if (userError) {
        logError(`Error creating user (request ID: ${requestId})`, userError);
        
        // Check for duplicate key errors with more specific handling
        if (userError.message?.includes("duplicate") || 
            userError.message?.includes("already exists") ||
            userError.message?.toLowerCase().includes("unique violation") ||
            userError.message?.includes("User already registered")) {
          
          // For duplicate email specifically
          if (userError.message?.includes("email") || userError.message?.includes("User already registered")) {
            return respondError("A user with this email address has already been registered", 409);
          }
          return respondError("A duplicate entry was detected", 409);
        }
        
        // Rate limiting errors
        if (userError.message?.includes("rate limit") || userError.message?.includes("too many")) {
          return respondError("Too many registration attempts. Please try again later.", 429);
        }
        
        // Invalid credentials or validation errors  
        if (userError.message?.includes("invalid") || userError.message?.includes("validation")) {
          return respondError(`Registration validation failed: ${userError.message}`, 400);
        }
        
        // Internal server errors
        return respondError(
          `Registration failed: ${userError.message}`,
          500
        );
      }
      
      if (!userData || !userData.user) {
        logError(`Empty result from user creation (request ID: ${requestId})`, null);
        return respondError("Registration failed with no result", 500);
      }
      
      userId = userData.user.id;
    }

    // Update or create profile with dealer role
    try {
      // First check if profile already exists
      const { data: profileData, error: profileCheckError } = await supabaseAdmin
        .from('profiles')
        .select('id, role')
        .eq('id', userId)
        .single();
      
      if (profileCheckError && profileCheckError.code !== 'PGRST116') {
        logWarning("Error checking for existing profile:", profileCheckError);
      }
      
      if (profileData) {
        // Profile exists, update it to include dealer role
        const { error: updateError } = await supabaseAdmin
          .from('profiles')
          .update({
            role: 'dealer',
            full_name: cleanedMetadata.name,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);
          
        if (updateError) {
          logWarning("Error updating profile:", updateError);
        }
      } else {
        // Create new profile with dealer role
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .insert({
            id: userId,
            role: 'dealer',
            full_name: cleanedMetadata.name,
            updated_at: new Date().toISOString()
          });
          
        if (profileError) {
          logWarning("Error creating profile:", profileError);
        }
      }
    } catch (metaError) {
      logWarning("Error managing profile:", metaError);
    }

    // Create dealer profile with better error handling
    try {
      const dealerInsertData = {
        user_id: userId,
        supervisor_name: cleanedMetadata.name,
        dealership_name: cleanedMetadata.companyName || cleanedMetadata.name,
        tax_id: (cleanedMetadata.taxId || "").replace(/\D/g, ''),
        business_registry_number: (cleanedMetadata.businessRegistryNumber || "").replace(/\D/g, ''),
        address: cleanedMetadata.companyAddress || "",
        verification_status: 'pending',
        is_verified: false,
        license_number: (cleanedMetadata.businessRegistryNumber || "").replace(/\D/g, ''),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      logInfo("Inserting dealer record:", dealerInsertData);

      const { data: dealerData, error: dealerError } = await supabaseAdmin
        .from('dealers')
        .insert(dealerInsertData)
        .select()
        .single();

      if (dealerError) {
        logError("Error creating dealer profile:", dealerError);
        
        // If dealer creation fails but user was created, check if it's a duplicate key error (registration already complete)
        if (dealerError.code === '23505' || dealerError.message?.includes('duplicate key')) {
          logInfo("Dealer profile already exists, treating as successful completion");
          
          // Create session for existing user
          const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.createSession({
            userId: userId
          });
          
          return respondSuccess({
            success: true,
            userId: userId,
            existingUser: true,
            session: sessionData?.session || null,
            message: "Registration successful. You can now log in to your account."
          });
        }
        
        // If dealer creation fails for other reasons, return partial success
        return respondSuccess({
          success: true,
          userId: userId,
          existingUser: existingUser,
          session: null,
          partialSuccess: true,
          warning: "User account created but dealer profile setup incomplete. Please contact support.",
          message: "Registration partially successful. Please log in and complete your profile setup."
        });
      }

      logInfo("Dealer profile created successfully:", dealerData?.id);
    } catch (profileError) {
      logError("Exception creating dealer profile:", profileError);
      
      // Check if it's actually a duplicate key error (registration already complete)
      if (profileError.toString().includes('duplicate key') || profileError.toString().includes('23505')) {
        logInfo("Dealer profile already exists due to duplicate key, treating as successful completion");
        
        // Create session for existing user
        const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.createSession({
          userId: userId
        });
        
        return respondSuccess({
          success: true,
          userId: userId,
          existingUser: true,
          session: sessionData?.session || null,
          message: "Registration successful. You can now log in to your account."
        });
      }
      
      // Return partial success if dealer profile creation fails for other reasons
      return respondSuccess({
        success: true,
        userId: userId,
        existingUser: existingUser,
        session: null,
        partialSuccess: true,
        warning: "User account created but dealer profile setup failed. Please contact support.",
        message: "Registration partially successful. Please log in and complete your profile setup."
      });
    }

    // Create a session immediately so the user can be logged in right after registration
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.createSession({
      userId: userId
    });

    if (sessionError) {
      logWarning(`Error creating immediate session for user ${userId}:`, sessionError);
      // Continue despite error - login will still work manually
    }

    // Successfully created/updated user
    logInfo(`User registered successfully (request ID: ${requestId}): ${userId}, existingUser: ${existingUser}`);
    
    // Return success with session if available
    return respondSuccess({
      success: true,
      userId: userId,
      existingUser: existingUser,
      session: sessionData?.session || null,
      message: "Registration successful. You can now log in to your account."
    });
  } catch (error) {
    logError(`Unexpected error in registration handler (request ID: ${requestId})`, error);
    return respondError(
      `Registration failed unexpectedly: ${error.message}`,
      500
    );
  }
}
