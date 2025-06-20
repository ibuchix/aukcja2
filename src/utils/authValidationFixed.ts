
import { supabase } from '@/integrations/supabase/client';

interface CarRecord {
  id: string;
  email?: string;
  [key: string]: any;
}

export const checkEmailExists = async (email: string): Promise<boolean> => {
  try {
    // Use a simple database query instead of RPC function
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .limit(1);

    if (error) {
      console.error('Error checking email:', error);
      return false;
    }

    return data && data.length > 0;
  } catch (error) {
    console.error('Exception checking email:', error);
    return false;
  }
};

export const validateDealerEmail = async (email: string) => {
  try {
    const exists = await checkEmailExists(email);
    return {
      exists,
      isValid: !exists,
      error: exists ? 'Email already registered' : null
    };
  } catch (error) {
    return {
      exists: false,
      isValid: false,
      error: 'Unable to validate email'
    };
  }
};
