import { Router } from 'express';
import * as controller from './content.controller.ts';
import { requireAuth, requireRole } from '../../middleware/authenticate.ts';

export const contentRouter = Router();

// --- News ---
contentRouter.get('/news', requireAuth, controller.listNews);
contentRouter.get('/news/:slug', requireAuth, controller.getNews);
contentRouter.post('/news', requireAuth, requireRole('ADMIN', 'COORDINATOR'), controller.createNews);
contentRouter.patch('/news/:id/status', requireAuth, requireRole('ADMIN', 'COORDINATOR'), controller.updateNewsStatus);

// --- Events ---
contentRouter.get('/events', requireAuth, controller.listEvents);
contentRouter.get('/events/:slug', requireAuth, controller.getEvent);
contentRouter.post('/events', requireAuth, requireRole('ADMIN', 'COORDINATOR'), controller.createEvent);
contentRouter.patch('/events/:id/status', requireAuth, requireRole('ADMIN', 'COORDINATOR'), controller.updateEventStatus);
contentRouter.post('/events/:id/register', requireAuth, requireRole('STUDENT'), controller.registerForEvent);
contentRouter.get('/events/:id/registrations', requireAuth, requireRole('ADMIN', 'COORDINATOR'), controller.listEventRegistrations);

// --- Broadcasts ---
contentRouter.get('/broadcasts', requireAuth, requireRole('ADMIN', 'COORDINATOR'), controller.listBroadcasts);
contentRouter.post('/broadcasts', requireAuth, requireRole('ADMIN'), controller.sendBroadcast);
