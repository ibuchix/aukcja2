import * as z from "zod";

export const dealerFormSchema = z.object({
  supervisorName: z.string().min(2, {
    message: "Supervisor name must be at least 2 characters",
  }),
  email: z.string().email({
    message: "Please enter a valid email address",
  }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters",
  }),
  phoneNumber: z.string().min(9, {
    message: "Please enter a valid phone number",
  }),
  companyName: z.string().min(2, {
    message: "Company name must be at least 2 characters",
  }),
  taxId: z.string().min(10, {
    message: "Please enter a valid NIP (Tax ID) number",
  }).max(10, {
    message: "NIP (Tax ID) number cannot exceed 10 characters",
  }).regex(/^\d+$/, {
    message: "NIP (Tax ID) must contain only numbers",
  }),
  businessRegistryNumber: z.string().min(9, {
    message: "Please enter a valid REGON number",
  }).max(14, {
    message: "REGON number cannot exceed 14 characters",
  }).regex(/^\d+$/, {
    message: "REGON number must contain only numbers",
  }),
  companyAddress: z.string().min(5, {
    message: "Please enter a valid company address",
  }),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions",
  }),
});

export type DealerFormValues = z.infer<typeof dealerFormSchema>;