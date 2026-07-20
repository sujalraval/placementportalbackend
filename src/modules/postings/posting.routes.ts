import { Router } from 'express';
import * as controller from './posting.controller.ts';
import { requireAuth, requireRole } from '../../middleware/authenticate.ts';

export const postingRouter = Router();

// Base routes
postingRouter.get('/', requireAuth, controller.list);
postingRouter.get('/:id', requireAuth, controller.getById);
postingRouter.post('/', requireAuth, requireRole('ADMIN', 'COORDINATOR', 'RECRUITER'), controller.create);
postingRouter.patch('/:id', requireAuth, requireRole('ADMIN', 'COORDINATOR', 'RECRUITER'), controller.update);

// Status transition
postingRouter.patch('/:id/status', requireAuth, requireRole('ADMIN', 'COORDINATOR', 'RECRUITER'), controller.updateStatus);

// Selection Rounds
postingRouter.get('/:id/rounds', requireAuth, controller.listRounds);
postingRouter.post('/:id/rounds', requireAuth, requireRole('ADMIN', 'COORDINATOR', 'RECRUITER'), controller.addRound);
postingRouter.patch('/:id/rounds/:roundId', requireAuth, requireRole('ADMIN', 'COORDINATOR', 'RECRUITER'), controller.updateRound);
postingRouter.delete('/:id/rounds/:roundId', requireAuth, requireRole('ADMIN', 'COORDINATOR', 'RECRUITER'), controller.removeRound);
