import { z } from 'zod';

/**
 * Route parameter schema for validating matchId.
 * Coerces string route parameters to positive integers.
 */
export const matchIdParamSchema = z.object({
  matchId: z.coerce.number().int().positive(),
});

/**
 * Query schema for listing commentary entries.
 * Validates an optional limit parameter coerced to a positive integer up to 100.
 */
export const listCommentaryQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
});

/**
 * Schema for creating a new commentary entry.
 */
export const createCommentarySchema = z.object({
  minutes: z.number().int().nonnegative(),
  sequence: z.number().int(),
  period: z.string(),
  eventType: z.string(),
  actor: z.string(),
  team: z.string(),
  message: z.string().min(1, 'message must be a non-empty string'),
  metadata: z.record(z.string(), z.unknown()),
  tags: z.array(z.string()),
});
