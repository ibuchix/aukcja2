import { corsHeaders } from '../_shared/cors.ts'
import type { ErrorResponse, SuccessResponse } from './types.ts'

export const createResponse = (
  data: any, 
  status: number = 200, 
  headers?: Record<string, string>
) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
      ...headers
    }
  });
};

export const errorResponse = (
  error: string,
  status: number = 400,
  details?: Record<string, any>
) => {
  return createResponse(
    { success: false, error, ...details },
    status
  );
};

export const successResponse = (data: any) => {
  return createResponse({ success: true, ...data });
};

export const createErrorResponse = (message: string, status = 400, additionalInfo = {}) => {
  const response: ErrorResponse = {
    success: false,
    error: message,
    ...additionalInfo
  }
  
  return errorResponse(message, status, additionalInfo);
}

export const createSuccessResponse = (data: Omit<SuccessResponse, 'success'>) => {
  const sanitizedData: SuccessResponse = {
    success: true,
    message: data.message,
    ...data.user && {
      user: {
        id: data.user.id,
        email: data.user.email
      }
    },
    ...data.dealer && {
      dealer: {
        id: data.dealer.id,
        dealership_name: data.dealer.dealership_name,
        verification_status: data.dealer.verification_status,
        is_verified: data.dealer.is_verified
      }
    },
    ...data.session && {
      session: {
        access_token: data.session.access_token,
        expires_at: data.session.expires_at
      }
    },
    ...data.requiresVerification !== undefined && {
      requiresVerification: data.requiresVerification
    },
    ...data.exists !== undefined && {
      exists: data.exists
    }
  }

  return successResponse(sanitizedData);
}

export const sanitizeError = (error: any): string => {
  console.error('Original error:', error)

  if (typeof error === 'object' && error !== null) {
    if (error.code === '23505') {
      if (error.message?.toLowerCase().includes('email')) {
        return 'An account with this email already exists'
      }
      if (error.message?.toLowerCase().includes('business_registry_number')) {
        return 'This business registry number is already registered'
      }
      if (error.message?.toLowerCase().includes('tax_id')) {
        return 'This tax ID is already registered'
      }
      return 'A duplicate registration was detected'
    }

    if (error.message?.includes('Invalid login credentials')) {
      return 'Invalid email or password'
    }
  }

  return 'An unexpected error occurred. Please try again later'
}
