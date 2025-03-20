
import { z } from 'zod';

/**
 * Base schema for all database records
 */
export const baseRecordSchema = z.object({
  id: z.string().uuid(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

/**
 * Schema for creating new records (without id, created_at, updated_at)
 */
export const createRecordSchema = z.object({}).passthrough();

/**
 * Schema for updating records (all fields optional)
 */
export const updateRecordSchema = z.object({}).passthrough();
