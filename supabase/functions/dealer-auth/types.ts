
export interface AuthRequest {
  action: 'register' | 'login'
  email: string
  password: string
  supervisorName?: string
  phoneNumber?: string
  companyName?: string
  taxId?: string 
  businessRegistryNumber?: string
  companyAddress?: string
}

export interface ErrorResponse {
  success: false
  error: string
}

export interface SuccessResponse {
  success: true
  message: string
  user?: {
    id: string
    email: string
  }
  dealer?: {
    id: string
    dealership_name: string
    verification_status: string
    is_verified: boolean
  }
  session?: {
    access_token: string
    expires_at: number
  }
  requiresVerification?: boolean
}
