
import { UseFormReturn } from "react-hook-form";
import { DealerFormValues } from "@/schemas/dealerFormSchema";
import { PersonalInfoFields } from "./dealer-form/PersonalInfoFields";
import { PasswordFields } from "./dealer-form/PasswordFields";
import { CompanyInfoFields } from "./dealer-form/CompanyInfoFields";
import { TermsAcceptance } from "./dealer-form/TermsAcceptance";

interface DealerFormFieldsProps {
  form: UseFormReturn<DealerFormValues>;
  showPasswordFields?: boolean;
}

export function DealerFormFields({ form, showPasswordFields = true }: DealerFormFieldsProps) {
  return (
    <>
      <PersonalInfoFields form={form} />
      {showPasswordFields && <PasswordFields form={form} />}
      <CompanyInfoFields form={form} />
      <TermsAcceptance form={form} />
    </>
  );
}
