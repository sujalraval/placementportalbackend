import { Router } from 'express';
import * as controller from './user.controller.ts';
import { requireAuth, requireRole } from '../../middleware/authenticate.ts';

/// The doc's "Users & roles" module — the one console with no data-visibility
/// fence, so every route here is ADMIN-only. There is no public or
/// self-service surface: creating a STUDENT/RECRUITER account goes through
/// /auth/register/*, not here.
export const userRouter = Router();

userRouter.use(requireAuth, requireRole('ADMIN'));

userRouter.get('/', controller.list);
userRouter.get('/:id', controller.getById);
userRouter.post('/', controller.create);
userRouter.patch('/:id', controller.update);
userRouter.patch('/:id/status', controller.setStatus);
userRouter.delete('/:id', controller.remove);
