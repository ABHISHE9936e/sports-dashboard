import { Router } from 'express';
import prisma from '../prisma.js';
import {
  matchIdParamSchema,
  createCommentarySchema,
  listCommentaryQuerySchema,
} from '../validation/commentary.js';

export const commentaryRouter = Router({ mergeParams: true });

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 100;

commentaryRouter.get('/', async (req, res) => {
  const parsedParams = matchIdParamSchema.safeParse(req.params);
  if (!parsedParams.success) {
    return res.status(400).json({
      error: 'Invalid route parameters',
      details: parsedParams.error.flatten().fieldErrors,
    });
  }

  const parsedQuery = listCommentaryQuerySchema.safeParse(req.query);
  if (!parsedQuery.success) {
    return res.status(400).json({
      error: 'Invalid query parameters',
      details: parsedQuery.error.flatten().fieldErrors,
    });
  }

  try {
    const { matchId } = parsedParams.data;
    const limit = Math.min(parsedQuery.data.limit ?? DEFAULT_LIMIT, MAX_LIMIT);

    const commentary = await prisma.commentary.findMany({
      where: {
        matchId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return res.status(200).json(commentary);
  } catch (error) {
    console.error('Error fetching commentary:', error);
    return res.status(500).json({ error: 'Failed to fetch commentary' });
  }
});

commentaryRouter.post('/', async (req, res) => {
  const parsedParams = matchIdParamSchema.safeParse(req.params);
  if (!parsedParams.success) {
    return res.status(400).json({
      error: 'Invalid route parameters',
      details: parsedParams.error.flatten().fieldErrors,
    });
  }

  const parsedBody = createCommentarySchema.safeParse(req.body);
  if (!parsedBody.success) {
    return res.status(400).json({
      error: 'Invalid commentary data',
      details: parsedBody.error.flatten().fieldErrors,
    });
  }

  try {
    const { matchId } = parsedParams.data;
    const {
      minutes,
      sequence,
      period,
      eventType,
      actor,
      team,
      message,
      metadata,
      tags,
    } = parsedBody.data;

    const commentary = await prisma.commentary.create({
      data: {
        matchId,
        minute: minutes,
        sequence,
        period,
        eventType,
        actor,
        team,
        message,
        metadata,
        tags,
      },
    });

if (req.app.locals.broadcastCommentry) {
  req.app.locals.broadcastCommentry(matchId, commentary);
}
return res.status(201).json(commentary);
    return res.status(201).json(commentary);
  } catch (error) {
    console.error('Error creating commentary:', error);

    if (error.code === 'P2003') {
      return res.status(404).json({ error: 'Match not found' });
    }

    return res.status(500).json({ error: 'Failed to create commentary' });
  }
});

export default commentaryRouter;
