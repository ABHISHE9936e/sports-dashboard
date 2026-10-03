import { z } from 'zod';

/**
 * Match status constant representing match lifecycle states.
 */
export const matchStatus = Object.freeze({
  SCHEDULED: 'SCHEDULED',
  LIVE: 'LIVE',
  FINISHED: 'FINISHED',
});

/**
 * Query schema for listing matches with an optional positive integer limit up to 100.
 */
export const listMatchesQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
});

/**
 * Schema for creating a new match.
 */
export const createMatchSchema = z.object({
  sport: z.string().min(1, 'sport must be a non-empty string'),
  homeTeam: z.string().min(1, 'homeTeam must be a non-empty string'),
  awayTeam: z.string().min(1, 'awayTeam must be a non-empty string'),
  status: z.enum([matchStatus.SCHEDULED, matchStatus.LIVE, matchStatus.FINISHED]).optional(),
  startTime: z.string().datetime({ message: 'startTime must be a valid ISO 8601 datetime string' }),
  endTime: z.string().datetime({ message: 'endTime must be a valid ISO 8601 datetime string' }),
  homeScore: z.number().int().nonnegative().optional(),
  awayScore: z.number().int().nonnegative().optional(),
});
