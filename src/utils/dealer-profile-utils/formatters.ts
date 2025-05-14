
/**
 * Helper functions for formatting and mapping dealer profile data
 */

import { DealerFormValues } from "@/schemas/dealerFormSchema";
import { normalizePhoneNumber, normalizeEmail } from "./normalizers";

/**
 * Maps form values to database-ready structure 
 */
export function mapFormToDatabase(values: DealerFormValues): Record<string, any> {
  return {
    supervisor_name: values.supervisorName.trim(),
    dealership_name: values.companyName.trim(),
    tax_id: values.taxId.trim(),
    business_registry_number: values.businessRegistryNumber.trim(),
    address: values.companyAddress.trim(),
    email: normalizeEmail(values.email),
    phone_number: values.phoneNumber ? normalizePhoneNumber(values.phoneNumber) : null
  };
}
