import { Router } from 'express';
import * as controller from './notification.controller.ts';
import { requireAuth, requireRole } from '../../middleware/authenticate.ts';

export const notificationRouter = Router();

// Everyone can view and manage their own notifications
notificationRouter.get('/', requireAuth, controller.listMine);
notificationRouter.patch('/read-all', requireAuth, controller.markAllAsRead);
notificationRouter.patch('/:id/read', requireAuth, controller.markAsRead);

// Admin dispatcher endpoint (intended for cron/manual trigger)
notificationRouter.post('/process-outbox', requireAuth, requireRole('ADMIN'), controller.processOutbox);
