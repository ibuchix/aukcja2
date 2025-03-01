import React, { useState } from "react";
import { toast } from "sonner";
import { SqlApprovalDialog } from "@/components/SqlApprovalDialog";

const sqlMigration = `
CREATE OR REPLACE FUNCTION create_dealer_transaction(
  p_email TEXT,
  p_password TEXT,
  p_supervisor_name TEXT,
  p_company_name TEXT,
  p_tax_id TEXT,
  p_business_registry_number TEXT,
  p_company_address TEXT
) RETURNS JSON AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Create auth user
  user_id := gen_random_uuid();
  
  INSERT INTO auth.users (
    id, instance_id, email, password,
    email_confirmed_at, raw_app_meta_data,
    raw_user_meta_data, created_at, updated_at
  ) VALUES (
    user_id,
    '00000000-0000-0000-0000-000000000000',
    p_email,
    crypt(p_password, gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object(
      'name', p_supervisor_name,
      'company', p_company_name
    ),
    NOW(),
    NOW()
  );

  -- Create profile
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (user_id, 'dealer', p_supervisor_name);

  -- Create dealer record
  INSERT INTO public.dealers (
    user_id, supervisor_name, dealership_name,
    tax_id, business_registry_number, address
  ) VALUES (
    user_id,
    p_supervisor_name,
    p_company_name,
    p_tax_id,
    p_business_registry_number,
    p_company_address
  );

  RETURN json_build_object(
    'success', true,
    'user', json_build_object(
      'id', user_id,
      'email', p_email
    )
  );

EXCEPTION WHEN others THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`;

export default function Index() {
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleApprove = () => {
    // Here you would typically call an API endpoint to run the migration
    toast.success("SQL migration approved! Migration would run now.");
    setDialogOpen(false);
  };

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Car Auction Platform</h1>
        <p className="text-lg text-gray-700">
          Welcome to our premier car auction platform for dealers.
        </p>
      </div>

      <div className="bg-gray-100 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">SQL Migration Approval</h2>
        <p className="mb-4">
          There's a pending SQL migration that needs your approval.
          This migration adds a transaction function for creating dealer accounts.
        </p>
        <Button onClick={() => setDialogOpen(true)}>
          Review SQL Migration
        </Button>
      </div>

      <SqlApprovalDialog
        sql={sqlMigration}
        isOpen={dialogOpen}
        onOpenChange={setDialogOpen}
        onApprove={handleApprove}
      />
    </div>
  );
}
