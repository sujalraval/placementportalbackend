import { Router } from 'express';
import * as controller from './drive.controller.ts';
import { requireAuth, requireRole } from '../../middleware/authenticate.ts';

export const driveRouter = Router();

// Student facing
driveRouter.get('/', requireAuth, controller.list);
driveRouter.get('/:id', requireAuth, controller.getById);
driveRouter.post('/:id/register', requireAuth, requireRole('STUDENT'), controller.register);

// Admin/Recruiter facing
driveRouter.post('/', requireAuth, requireRole('ADMIN', 'COORDINATOR', 'RECRUITER'), controller.create);
driveRouter.patch('/:id', requireAuth, requireRole('ADMIN', 'COORDINATOR', 'RECRUITER'), controller.update);
driveRouter.patch('/:id/status', requireAuth, requireRole('ADMIN', 'COORDINATOR', 'RECRUITER'), controller.updateStatus);

driveRouter.get('/:id/registrations', requireAuth, requireRole('ADMIN', 'COORDINATOR', 'RECRUITER'), controller.listRegistrations);
driveRouter.patch('/:id/registrations/:studentId/attendance', requireAuth, requireRole('ADMIN', 'COORDINATOR', 'RECRUITER'), controller.markAttendance);
