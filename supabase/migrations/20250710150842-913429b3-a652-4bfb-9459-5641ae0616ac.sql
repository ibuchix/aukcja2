-- Create missing update_dealer_profile RPC function
CREATE OR REPLACE FUNCTION public.update_dealer_profile(
  p_user_id uuid,
  p_supervisor_name text,
  p_dealership_name text,
  p_address text,
  p_phone_number text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_dealer_id uuid;
BEGIN
  -- Get dealer ID
  SELECT id INTO v_dealer_id
  FROM dealers 
  WHERE user_id = p_user_id;
  
  IF v_dealer_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Dealer profile not found'
    );
  END IF;
  
  -- Update dealer profile
  UPDATE dealers
  SET 
    supervisor_name = p_supervisor_name,
    dealership_name = p_dealership_name,
    address = p_address,
    updated_at = NOW()
  WHERE id = v_dealer_id;
  
  -- Update profiles table if phone number provided
  IF p_phone_number IS NOT NULL THEN
    UPDATE profiles
    SET full_name = p_supervisor_name,
        updated_at = NOW()
    WHERE id = p_user_id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Profile updated successfully'
  );
END;
$$;

-- Create dealer-documents storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('dealer-documents', 'dealer-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for dealer-documents bucket
CREATE POLICY "Dealers can upload their own documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'dealer-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Dealers can view their own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'dealer-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Dealers can update their own documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'dealer-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Dealers can delete their own documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'dealer-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Admin access to all documents
CREATE POLICY "Admins can manage all dealer documents"
ON storage.objects FOR ALL
USING (
  bucket_id = 'dealer-documents' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Ensure dealer records exist for recently registered users
-- This helps fix any users who got registered but missed dealer record creation
DO $$
DECLARE
  user_rec RECORD;
BEGIN
  FOR user_rec IN 
    SELECT au.id, au.email, au.raw_user_meta_data
    FROM auth.users au
    LEFT JOIN dealers d ON d.user_id = au.id
    WHERE d.id IS NULL
    AND au.raw_user_meta_data->>'role' = 'dealer'
    AND au.created_at > NOW() - INTERVAL '24 hours'
  LOOP
    -- Create missing dealer record
    INSERT INTO dealers (
      user_id,
      supervisor_name,
      dealership_name,
      tax_id,
      business_registry_number,
      address,
      verification_status,
      is_verified,
      license_number
    ) VALUES (
      user_rec.id,
      COALESCE(user_rec.raw_user_meta_data->>'name', 'Unknown'),
      COALESCE(user_rec.raw_user_meta_data->>'companyName', 'Unknown Company'),
      COALESCE(user_rec.raw_user_meta_data->>'taxId', ''),
      COALESCE(user_rec.raw_user_meta_data->>'businessRegistryNumber', ''),
      COALESCE(user_rec.raw_user_meta_data->>'companyAddress', ''),
      'pending',
      false,
      COALESCE(user_rec.raw_user_meta_data->>'businessRegistryNumber', '')
    );
    
    -- Ensure profile exists with dealer role
    INSERT INTO profiles (id, role, full_name)
    VALUES (
      user_rec.id, 
      'dealer', 
      user_rec.raw_user_meta_data->>'name'
    )
    ON CONFLICT (id) DO UPDATE
    SET role = 'dealer', updated_at = NOW();
  END LOOP;
END $$;