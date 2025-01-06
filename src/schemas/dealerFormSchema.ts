import * as z from "zod";

export const dealerFormSchema = z.object({
  supervisorName: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phoneNumber: z.string().min(9, "Valid phone number is required"),
  companyName: z.string().min(2, "Company name is required"),
  taxId: z.string().min(10, "Valid NIP number is required"),
  businessRegistryNumber: z.string().min(9, "Valid REGON number is required"),
  companyAddress: z.string().min(5, "Company address is required"),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions",
  }),
});

export type DealerFormValues = z.infer<typeof dealerFormSchema>;