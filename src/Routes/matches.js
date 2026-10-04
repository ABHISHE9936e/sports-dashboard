export * from '../../validations/matches.js';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { syncMatchStatus } from '../utils/match-status.js';
import {getMatchStatus} from '../utils/match-status.js';
import {Router} from 'express';
import { createMatchSchema } from '../../validations/matches.js';
const prisma = new PrismaClient();
import { listMatchesQuerySchema } from '../../validations/matches.js';

export const matchesRouter = new Router();
const Max_limit = 100;

matchesRouter.get('/', async (req, res) => {
  const parsedQuery = listMatchesQuerySchema.safeParse(req.query);

  if (!parsedQuery.success) {

    return res.status(400).json({
      error: 'Invalid query parameters',
      details: parsedQuery.error.flatten().fieldErrors,
    });
  }
  const { limit } = parsedQuery.data;
  
  if (limit && (isNaN(limit) || parseInt(limit) <= 0 || parseInt(limit) > Max_limit)) {
    return res.status(400).json({
      error: 'Invalid limit parameter',
    });
  }
  try {
  const matches = await prisma.match.findMany({
    take: limit,
    orderBy: {
      startTime: 'asc',
    },
  });
  res.json(matches);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

matchesRouter.post('/', async (req, res) => {
  const parsedData = createMatchSchema.safeParse(req.body);

  if (!parsedData.success) {
    return res.status(400).json({
      error: 'Invalid match data',
      details: parsedData.error.flatten().fieldErrors,
    });
  }

  try {
    const { sport, homeTeam, awayTeam, startTime, endTime } = parsedData.data;

    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    const calculatedStatus = getMatchStatus(startDate, endDate);

    const match = await prisma.match.create({
      data: {
        sport,
        homeTeam,
        awayTeam,
        status: calculatedStatus,
        startTime: startDate,
        endTime: endDate,
      },
    });
if(res.app.locals.broadcastMatchCreated){
        res.app.locals.broadcastMatchCreated(match);
}
    return res.status(201).json(match);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to create match' });
  }
});