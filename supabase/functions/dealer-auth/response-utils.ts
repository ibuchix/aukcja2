
import { corsHeaders } from '../_shared/cors.ts'
import type { ErrorResponse, SuccessResponse } from './types.ts'

export const createErrorResponse = (message: string, status = 400, additionalInfo = {}) => {
  const response: ErrorResponse = {
    success: false,
    error: message,
    ...additionalInfo
  }
  
  return new Response(
    JSON.stringify(response),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status,
    }
  )
}

// Add the missing createResponse function that was being imported in handlers.ts
export const createResponse = (data: Omit<SuccessResponse, 'success'>) => {
  return createSuccessResponse(data);
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
    // Add support for the exists property for email check functions
    ...data.exists !== undefined && {
      exists: data.exists
    }
  }

  return new Response(
    JSON.stringify(sanitizedData),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  )
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
