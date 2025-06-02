
import { UseFormReturn } from "react-hook-form";
import { DealerFormValues } from "@/schemas/dealerFormSchema";
import { PersonalInfoFields } from "./dealer-form/PersonalInfoFields";
import { PasswordFields } from "./dealer-form/PasswordFields";
import { CompanyInfoFields } from "./dealer-form/CompanyInfoFields";
import { TermsAcceptance } from "./dealer-form/TermsAcceptance";
import { useEnhancedFormValidation } from "@/hooks/registration/useEnhancedFormValidation";
import { useEffect } from "react";

interface DealerFormFieldsProps {
  form: UseFormReturn<DealerFormValues>;
  showPasswordFields?: boolean;
}

export function DealerFormFields({ form, showPasswordFields = true }: DealerFormFieldsProps) {
  const { validateField } = useEnhancedFormValidation();
  
  // Watch for field changes and validate them
  useEffect(() => {
    const subscription = form.watch(async (value, { name }) => {
      if (name && value[name] !== undefined) {
        // Validate field on blur/change with toast feedback
        const fieldValue = value[name];
        if (fieldValue && fieldValue !== '') {
          try {
            await validateField(name as keyof DealerFormValues, fieldValue);
          } catch (error) {
            console.error('Field validation error:', error);
          }
        }
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form, validateField]);
  
  return (
    <>
      <PersonalInfoFields form={form} />
      {showPasswordFields && <PasswordFields form={form} />}
      <CompanyInfoFields form={form} />
      <TermsAcceptance form={form} />
    </>
  );
}
