
import { useFormValidation } from '@/hooks/useFormValidation';
import { useFieldValidation } from './useFieldValidation';
import { DealerFormValues } from '@/schemas/dealerFormSchema';
import { useToast } from '@/hooks/use-toast';

export function useEnhancedFormValidation() {
  const { toast } = useToast();
  const fieldValidation = useFieldValidation();
  const baseValidation = useFormValidation<DealerFormValues>('dealer-registration');

  const validateField = async (fieldName: keyof DealerFormValues, value: any) => {
    switch (fieldName) {
      case 'supervisorName':
        return fieldValidation.validateSupervisorName(value);
      case 'email':
        // Trigger async email check
        fieldValidation.checkEmailAvailability(value);
        return true; // Return true for immediate validation, async check will handle the result
      case 'password':
        return fieldValidation.validatePassword(value);
      case 'confirmPassword':
        // This is handled by the form schema
        return true;
      case 'phoneNumber':
        return await fieldValidation.validatePhoneField(value);
      case 'companyName':
        return fieldValidation.validateCompanyName(value);
      case 'taxId':
        return await fieldValidation.validateTaxID(value);
      case 'businessRegistryNumber':
        // Trigger async registry check
        fieldValidation.checkBusinessRegistryAvailability(value);
        return true; // Return true for immediate validation, async check will handle the result
      case 'companyAddress':
        return fieldValidation.validateAddress(value);
      case 'acceptTerms':
        if (!value) {
          toast({
            title: "Terms Acceptance Required",
            description: "You must accept the terms and conditions to continue",
            variant: "destructive",
          });
          return false;
        }
        toast({
          title: "Terms Accepted ✓",
          description: "Thank you for accepting our terms and conditions",
        });
        return true;
      default:
        return true;
    }
  };

  const validateFormWithToasts = (values: DealerFormValues) => {
    const baseResult = baseValidation.validateForm(values);
    
    // Show toast for overall form validation result
    if (!baseResult.isValid) {
      toast({
        title: "Form Validation Failed",
        description: "Please correct the highlighted errors before submitting",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Form Validation Passed ✓",
        description: "All fields are valid. Submitting registration...",
      });
    }
    
    return baseResult;
  };

  return {
    ...baseValidation,
    ...fieldValidation,
    validateField,
    validateFormWithToasts,
  };
}
