
import { RegisterRequest, LoginRequest, EmailCheckRequest } from './types.ts';

interface ValidationResult {
  valid: boolean;
  error?: string;
}

// Validate registration request
export function validateRegisterRequest(request: any): ValidationResult {
  if (!request || typeof request !== 'object') {
    return { valid: false, error: 'Invalid request format' };
  }

  if (!request.email || typeof request.email !== 'string') {
    return { valid: false, error: 'Email is required and must be a string' };
  }

  if (!request.password || typeof request.password !== 'string') {
    return { valid: false, error: 'Password is required and must be a string' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(request.email)) {
    return { valid: false, error: 'Invalid email format' };
  }

  if (request.password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long' };
  }

  return { valid: true };
}

// Validate login request
export function validateLoginRequest(request: any): ValidationResult {
  if (!request || typeof request !== 'object') {
    return { valid: false, error: 'Invalid request format' };
  }

  if (!request.email || typeof request.email !== 'string') {
    return { valid: false, error: 'Email is required and must be a string' };
  }

  if (!request.password || typeof request.password !== 'string') {
    return { valid: false, error: 'Password is required and must be a string' };
  }

  return { valid: true };
}

// Validate email check request
export function validateEmailCheckRequest(request: any): ValidationResult {
  if (!request || typeof request !== 'object') {
    return { valid: false, error: 'Invalid request format' };
  }

  if (!request.email || typeof request.email !== 'string') {
    return { valid: false, error: 'Email is required and must be a string' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(request.email)) {
    return { valid: false, error: 'Invalid email format' };
  }

  return { valid: true };
}
