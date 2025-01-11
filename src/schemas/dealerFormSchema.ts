import * as z from "zod";

export const dealerFormSchema = z.object({
  supervisorName: z.string()
    .min(2, {
      message: "Supervisor name must be at least 2 characters",
    })
    .max(255, {
      message: "Supervisor name cannot exceed 255 characters",
    })
    .refine((value) => /^[a-zA-Z\s-']+$/.test(value), {
      message: "Supervisor name can only contain letters, spaces, hyphens, and apostrophes",
    }),
  email: z.string()
    .email({
      message: "Please enter a valid email address",
    })
    .min(5, {
      message: "Email must be at least 5 characters",
    })
    .max(255, {
      message: "Email cannot exceed 255 characters",
    }),
  password: z.string()
    .min(8, {
      message: "Password must be at least 8 characters",
    })
    .max(72, {
      message: "Password cannot exceed 72 characters",
    })
    .refine((value) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value), {
      message: "Password must contain at least one uppercase letter, one lowercase letter, and one number",
    }),
  phoneNumber: z.string()
    .min(9, {
      message: "Please enter a valid phone number",
    })
    .max(20, {
      message: "Phone number cannot exceed 20 characters",
    })
    .refine((value) => /^\+?[\d\s-()]+$/.test(value), {
      message: "Please enter a valid phone number format",
    }),
  companyName: z.string()
    .min(2, {
      message: "Company name must be at least 2 characters",
    })
    .max(255, {
      message: "Company name cannot exceed 255 characters",
    })
    .refine((value) => /^[a-zA-Z0-9\s.,&'-]+$/.test(value), {
      message: "Company name can only contain letters, numbers, spaces, and basic punctuation",
    }),
  taxId: z.string()
    .length(10, {
      message: "NIP (Tax ID) must be exactly 10 digits",
    })
    .refine((value) => /^\d+$/.test(value), {
      message: "NIP (Tax ID) must contain only numbers",
    }),
  businessRegistryNumber: z.string()
    .refine((val) => val.length === 9 || val.length === 14, {
      message: "REGON number must be either 9 or 14 digits",
    })
    .refine((value) => /^\d+$/.test(value), {
      message: "REGON number must contain only numbers",
    }),
  companyAddress: z.string()
    .min(5, {
      message: "Please enter a valid company address",
    })
    .max(500, {
      message: "Company address cannot exceed 500 characters",
    })
    .refine((value) => /^[a-zA-Z0-9\s.,/-]+$/.test(value), {
      message: "Please enter a valid address format",
    }),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions",
  }),
});

export type DealerFormValues = z.infer<typeof dealerFormSchema>;