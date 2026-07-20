import { Router } from 'express';
import * as controller from './program.controller.ts';
import { requireAuth, requireRole } from '../../middleware/authenticate.ts';

export const programRouter = Router();

// Public — the student registration form reads ?departmentId= to populate its
// program dropdown before an account exists.
programRouter.get('/', controller.list);
programRouter.get('/:id', controller.getById);

programRouter.post('/', requireAuth, requireRole('ADMIN'), controller.create);
programRouter.patch('/:id', requireAuth, requireRole('ADMIN'), controller.update);
programRouter.delete('/:id', requireAuth, requireRole('ADMIN'), controller.remove);
