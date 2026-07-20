import { Router } from 'express';
import * as controller from './sector.controller.ts';
import { requireAuth, requireRole } from '../../middleware/authenticate.ts';

export const sectorRouter = Router();

// Public — the recruiter onboarding form and company profile both need this
// list to populate a sector dropdown before an account exists.
sectorRouter.get('/', controller.list);
sectorRouter.get('/:id', controller.getById);

sectorRouter.post('/', requireAuth, requireRole('ADMIN'), controller.create);
sectorRouter.patch('/:id', requireAuth, requireRole('ADMIN'), controller.update);
sectorRouter.delete('/:id', requireAuth, requireRole('ADMIN'), controller.remove);
