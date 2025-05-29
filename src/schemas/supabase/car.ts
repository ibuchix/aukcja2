
import { z } from 'zod';
import { baseRecordSchema } from './common';

/**
 * Schema for car features
 */
export const carFeaturesSchema = z.object({
  exterior: z.array(z.string()).optional(),
  interior: z.array(z.string()).optional(),
  safety: z.array(z.string()).optional(),
  performance: z.array(z.string()).optional(),
  technology: z.array(z.string()).optional(),
  comfort: z.array(z.string()).optional(),
});

/**
 * Schema for car records - all cars are immediately available
 */
export const carSchema = baseRecordSchema.extend({
  title: z.string().nullish(),
  make: z.string().nullish(),
  model: z.string().nullish(),
  year: z.number().int().nullish(),
  price: z.number().nonnegative(),
  mileage: z.number().nullish(),
  transmission: z.string().nullish(),
  status: z.string().default('available'), // Always available when created
  seller_id: z.string().uuid().nullish(),
  features: carFeaturesSchema.nullish(),
  images: z.array(z.string()).nullish(), // Array of strings, not JSONB
  is_auction: z.boolean().default(false),
  auction_status: z.string().nullish(),
  auction_end_time: z.string().nullish(),
  current_bid: z.number().default(0),
  reserve_price: z.number().nullish(),
  minimum_bid_increment: z.number().default(100),
  required_photos: z.record(z.string()).nullish(), // JSONB object with string values
});

/**
 * Schema for creating a new car
 */
export const createCarSchema = carSchema.omit({ 
  id: true, 
  created_at: true, 
  updated_at: true 
});

/**
 * Schema for updating a car
 */
export const updateCarSchema = createCarSchema.partial();
