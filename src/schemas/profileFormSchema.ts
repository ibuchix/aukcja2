
import * as z from 'zod';

export const profileFormSchema = z.object({
  dealershipName: z.string().min(2, { message: 'Dealership name is required' }),
  supervisorName: z.string().min(2, { message: 'Supervisor name is required' }),
  taxId: z.string().min(3, { message: 'Tax ID is required' }),
  businessRegistryNumber: z.string().min(3, { message: 'Business registry number is required' }),
  address: z.string().min(5, { message: 'Address is required' }),
  licenseNumber: z.string().optional(),
});

export type DealerProfileFormValues = z.infer<typeof profileFormSchema>;
