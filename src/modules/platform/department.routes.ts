import { Router } from 'express';
import * as controller from './department.controller.ts';
import { requireAuth, requireRole } from '../../middleware/authenticate.ts';

/// The route table is where persona meets domain: the module is organised by
/// domain, and *who may call each route* is declared right here rather than
/// being spread through the service.
export const departmentRouter = Router();

// Public — the marketing site's department grid reads this with ?withStats=true.
departmentRouter.get('/', controller.list);
departmentRouter.get('/:id', controller.getById);

// The registry itself is Admin's ("Departments & programs" module).
departmentRouter.post('/', requireAuth, requireRole('ADMIN'), controller.create);
departmentRouter.patch('/:id', requireAuth, requireRole('ADMIN'), controller.update);
departmentRouter.delete('/:id', requireAuth, requireRole('ADMIN'), controller.remove);
