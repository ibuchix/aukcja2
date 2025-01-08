import { supabase } from "@/integrations/supabase/client";

export interface DealerRegistrationData {
  supervisorName: string;
  dealershipName: string;
  taxId: string;
  businessRegistryNumber: string;
  address: string | null;
  userId: string;
}

export const createDealerProfile = async (data: DealerRegistrationData) => {
  const { error } = await supabase
    .from('dealers')
    .insert({
      user_id: data.userId,
      supervisor_name: data.supervisorName,
      dealership_name: data.dealershipName,
      tax_id: data.taxId,
      business_registry_number: data.businessRegistryNumber,
      address: data.address,
      verification_status: 'pending',
      is_verified: false,
    });

  if (error) {
    console.error("Dealer creation error:", error);
    throw error;
  }
};