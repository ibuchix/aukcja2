-- Phase 1: Emergency fix for privilege escalation vulnerability
-- Block users from modifying their own role while preserving other update capabilities

-- Drop the vulnerable policy that allows unrestricted profile updates
DROP POLICY IF EXISTS "Authenticated users can update their own profiles" ON profiles;

-- Create new policy with column-level protection on role field
CREATE POLICY "Users can update own profile (role protected)"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND
  -- CRITICAL: Prevent role modification by ensuring new role equals current role
  role = (SELECT role FROM profiles WHERE id = auth.uid())
);

-- Note: Admin policies remain unchanged and can still modify roles via admin_update_user_role function