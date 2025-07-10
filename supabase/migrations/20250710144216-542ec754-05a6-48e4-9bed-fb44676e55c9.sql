-- Clean up orphaned user record for solmaemail@gmail.com
-- This user exists in auth.users but has no profile or dealer record
DELETE FROM auth.users 
WHERE email = 'solmaemail@gmail.com' 
  AND id = '64a370e7-164f-41f8-b452-d1943e63ec8c'
  AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = '64a370e7-164f-41f8-b452-d1943e63ec8c')
  AND NOT EXISTS (SELECT 1 FROM dealers WHERE user_id = '64a370e7-164f-41f8-b452-d1943e63ec8c');