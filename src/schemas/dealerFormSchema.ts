import * as z from "zod";

export const dealerFormSchema = z.object({
  supervisorName: z.string().min(2, {
    message: "Supervisor name must be at least 2 characters",
  }).max(255, {
    message: "Supervisor name cannot exceed 255 characters",
  }),
  email: z.string().email({
    message: "Please enter a valid email address",
  }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters",
  }),
  phoneNumber: z.string().min(9, {
    message: "Please enter a valid phone number",
  }).max(20, {
    message: "Phone number cannot exceed 20 characters",
  }),
  companyName: z.string().min(2, {
    message: "Company name must be at least 2 characters",
  }).max(255, {
    message: "Company name cannot exceed 255 characters",
  }),
  taxId: z.string()
    .length(10, {
      message: "NIP (Tax ID) must be exactly 10 digits",
    })
    .regex(/^\d+$/, {
      message: "NIP (Tax ID) must contain only numbers",
    }),
  businessRegistryNumber: z.string()
    .min(9, {
      message: "REGON number must be at least 9 digits",
    })
    .max(14, {
      message: "REGON number cannot exceed 14 digits",
    })
    .regex(/^\d+$/, {
      message: "REGON number must contain only numbers",
    }),
  companyAddress: z.string()
    .min(5, {
      message: "Please enter a valid company address",
    })
    .max(500, {
      message: "Company address cannot exceed 500 characters",
    }),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions",
  }),
});

export type DealerFormValues = z.infer<typeof dealerFormSchema>;