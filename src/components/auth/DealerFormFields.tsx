import { UseFormReturn } from "react-hook-form";
import { DealerFormValues } from "@/schemas/dealerFormSchema";
import { PersonalInfoFields } from "./dealer-form/PersonalInfoFields";
import { CompanyInfoFields } from "./dealer-form/CompanyInfoFields";
import { TermsAcceptance } from "./dealer-form/TermsAcceptance";

interface DealerFormFieldsProps {
  form: UseFormReturn<DealerFormValues>;
}

export function DealerFormFields({ form }: DealerFormFieldsProps) {
  return (
    <>
      <PersonalInfoFields form={form} />
      <CompanyInfoFields form={form} />
      <TermsAcceptance form={form} />
    </>
  );
}