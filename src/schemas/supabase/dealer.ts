
import { z } from 'zod';
import { baseRecordSchema } from './common';

/**
 * Schema for dealer record
 */
export const dealerSchema = baseRecordSchema.extend({
  user_id: z.string().uuid(),
  dealership_name: z.string().min(1),
  supervisor_name: z.string().optional(),
  address: z.string().optional(),
  tax_id: z.string().optional(),
  business_registry_number: z.string().optional(),
  is_verified: z.boolean().default(false),
  verification_status: z.enum(['pending', 'approved', 'rejected']).default('pending'),
});

/**
 * Schema for dealer verification
 */
export const dealerVerificationSchema = baseRecordSchema.extend({
  dealer_id: z.string().uuid(),
  document_url: z.string().url().optional(),
  status: z.enum(['pending', 'approved', 'rejected']).default('pending'),
  reviewed_by: z.string().uuid().optional(),
  review_date: z.string().datetime().optional(),
  notes: z.string().optional(),
});

/**
 * Schema for dealer watchlist
 */
export const dealerWatchlistSchema = baseRecordSchema.extend({
  buyer_id: z.string().uuid(),
  car_id: z.string().uuid(),
});

/**
 * Schema for dealer purchase
 */
export const dealerPurchaseSchema = baseRecordSchema.extend({
  dealer_id: z.string().uuid(),
  car_id: z.string().uuid(),
  purchase_date: z.string().datetime(),
  purchase_amount: z.number().positive(),
  status: z.enum(['pending', 'completed', 'cancelled']).default('pending'),
});
