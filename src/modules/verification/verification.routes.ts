import { Router } from 'express';
import * as controller from './verification.controller.ts';
import { requireAuth, requireRole } from '../../middleware/authenticate.ts';

export const verificationRouter = Router();

// Student routes
verificationRouter.get('/me', requireAuth, requireRole('STUDENT'), controller.listMine);
verificationRouter.post('/', requireAuth, requireRole('STUDENT'), controller.submit);

// Admin/Coordinator routes
verificationRouter.get('/', requireAuth, requireRole('ADMIN', 'COORDINATOR'), controller.list);
verificationRouter.patch('/:id', requireAuth, requireRole('ADMIN', 'COORDINATOR'), controller.review);
