
/**
 * Profile interface for user profile data
 */
export interface Profile {
  id: string;
  role: 'dealer' | 'seller' | 'admin';
  updated_at: string;
  suspended?: boolean;
  full_name?: string;
  avatar_url?: string;
}
