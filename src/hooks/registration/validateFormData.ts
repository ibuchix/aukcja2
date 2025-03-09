
import { DealerFormValues } from "@/schemas/dealerFormSchema";

/**
 * Additional client-side validation for registration form data
 */
export const validateFormData = (values: DealerFormValues): string[] => {
  const errors: string[] = [];

  // Validate phone number format
  if (!values.phoneNumber.startsWith('+') || values.phoneNumber.length < 8) {
    errors.push("Phone number must include country code and be at least 8 digits");
  }

  // Validate email format more strictly
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.push("Email address format is invalid");
  }

  // Validate tax ID format (basic check - could be customized per country)
  if (!/^[A-Za-z0-9]{5,}$/.test(values.taxId)) {
    errors.push("Tax ID must be at least 5 alphanumeric characters");
  }

  // Validate company name has at least two words
  if (values.companyName.trim().split(/\s+/).filter(Boolean).length < 2) {
    errors.push("Company name should include at least two words");
  }

  // Validate company address has street number and name
  if (!/\d+/.test(values.companyAddress) || values.companyAddress.length < 10) {
    errors.push("Company address should include street number and be complete");
  }

  return errors;
};
