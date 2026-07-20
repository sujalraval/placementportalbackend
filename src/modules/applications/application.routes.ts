import { Router } from 'express';
import * as controller from './application.controller.ts';
import { requireAuth, requireRole } from '../../middleware/authenticate.ts';

export const applicationRouter = Router();

// Student routes
applicationRouter.get('/me', requireAuth, requireRole('STUDENT'), controller.listMine);
applicationRouter.post('/', requireAuth, requireRole('STUDENT'), controller.apply);
applicationRouter.patch('/:id/offer/response', requireAuth, requireRole('STUDENT'), controller.respondToOffer);

// Recruiter/Staff routes
applicationRouter.get('/', requireAuth, requireRole('ADMIN', 'COORDINATOR', 'RECRUITER'), controller.list);
applicationRouter.patch('/:id/status', requireAuth, requireRole('ADMIN', 'COORDINATOR', 'RECRUITER'), controller.updateStatus);

// Rounds
applicationRouter.post('/:id/rounds', requireAuth, requireRole('ADMIN', 'COORDINATOR', 'RECRUITER'), controller.evaluateRound);

// Interviews
applicationRouter.post('/:id/interviews', requireAuth, requireRole('ADMIN', 'COORDINATOR', 'RECRUITER'), controller.scheduleInterview);
applicationRouter.patch('/:id/interviews/:interviewId', requireAuth, requireRole('ADMIN', 'COORDINATOR', 'RECRUITER'), controller.updateInterview);

// Offers
applicationRouter.post('/:id/offer', requireAuth, requireRole('ADMIN', 'COORDINATOR', 'RECRUITER'), controller.releaseOffer);
applicationRouter.post('/:id/offer/revoke', requireAuth, requireRole('ADMIN', 'COORDINATOR', 'RECRUITER'), controller.revokeOffer);
