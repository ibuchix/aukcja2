import * as z from "zod";

/**
 * Schema for password reset request form
 * Validates email, tax ID, business registry number, and supervisor name
 */
export const passwordResetRequestSchema = z.object({
  email: z.string()
    .email({ message: "Please enter a valid email address" })
    .max(255, { message: "Email cannot exceed 255 characters" })
    .transform((value) => value.trim().toLowerCase()),
  
  taxId: z.string()
    .length(10, { message: "Tax ID must be exactly 10 digits" })
    .refine((value) => /^\d+$/.test(value), {
      message: "Tax ID can only contain digits"
    }),
  
  businessRegistryNumber: z.string()
    .refine((val) => val.length === 9 || val.length === 14, {
      message: "Business Registry Number must be 9 or 14 digits"
    })
    .refine((value) => /^\d+$/.test(value), {
      message: "Business Registry Number can only contain digits"
    }),
  
  supervisorName: z.string()
    .min(2, { message: "Supervisor name must be at least 2 characters" })
    .max(100, { message: "Supervisor name cannot exceed 100 characters" })
    .refine((value) => /^[a-zA-ZĄąĆćĘęŁłŃńÓóŚśŹźŻż\s\-']+$/.test(value), {
      message: "Supervisor name can only contain letters, spaces, hyphens, and apostrophes"
    })
});

/**
 * Schema for password reset confirmation form
 * Validates password strength and confirmation match
 */
export const passwordResetConfirmSchema = z.object({
  newPassword: z.string()
    .min(8, { message: "Password must be at least 8 characters" })
    .max(72, { message: "Password cannot exceed 72 characters" })
    .refine((value) => /[A-Z]/.test(value), {
      message: "Password must contain at least one uppercase letter"
    })
    .refine((value) => /[a-z]/.test(value), {
      message: "Password must contain at least one lowercase letter"
    })
    .refine((value) => /[0-9]/.test(value), {
      message: "Password must contain at least one number"
    })
    .refine((value) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(value), {
      message: "Password must contain at least one special character"
    }),
  
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type PasswordResetRequestForm = z.infer<typeof passwordResetRequestSchema>;
export type PasswordResetConfirmForm = z.infer<typeof passwordResetConfirmSchema>;
