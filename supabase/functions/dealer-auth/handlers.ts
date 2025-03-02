
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from '@supabase/supabase-js';
import { errorResponse, successResponse } from './response-utils.ts';

// Define handler types
type RequestHandler = (req: Request, payload: any) => Promise<Response>;

// Handler map
export const handlers: Record<string, RequestHandler> = {
  // User registration
  'register': async (req, payload) => {
    try {
      const { email, password, metadata } = payload;
      
      if (!email || !password) {
        return errorResponse('Email and password are required');
      }
      
      // Create Supabase client with admin privileges
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') || '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
      );
      
      // Register the user
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: metadata || {}
      });
      
      if (error) {
        console.error('Registration error:', error);
        return errorResponse(error.message);
      }
      
      return successResponse({
        success: true,
        user: data.user,
        message: 'Registration successful'
      });
    } catch (error) {
      console.error('Unexpected error during registration:', error);
      return errorResponse(`Registration failed: ${error.message}`);
    }
  },

  // Login handler
  'login': async (req, payload) => {
    try {
      const { email, password } = payload;
      
      if (!email || !password) {
        return errorResponse('Email and password are required');
      }
      
      // Create Supabase client
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') || '',
        Deno.env.get('SUPABASE_ANON_KEY') || ''
      );
      
      // Attempt to sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        return errorResponse(error.message);
      }
      
      // Get dealer profile
      const { data: dealerData } = await supabase
        .from('dealers')
        .select('*')
        .eq('user_id', data.user.id)
        .single();
      
      return successResponse({
        success: true,
        session: data.session,
        dealer: dealerData
      });
    } catch (error) {
      console.error('Login error:', error);
      return errorResponse(`Login failed: ${error.message}`);
    }
  },

  // Check if email exists
  'check-email-exists': async (req, payload) => {
    try {
      const { email } = payload;
      
      if (!email) {
        return errorResponse('Email is required');
      }
      
      // Create Supabase admin client
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') || '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
      );
      
      // Check if email exists in auth.users
      const { data, error } = await supabaseAdmin.auth.admin.listUsers();
      
      if (error) {
        return errorResponse(error.message);
      }
      
      const exists = data.users.some(user => 
        user.email?.toLowerCase() === email.toLowerCase()
      );
      
      return successResponse({ exists });
    } catch (error) {
      console.error('Email check error:', error);
      return errorResponse(`Email check failed: ${error.message}`);
    }
  }
};
