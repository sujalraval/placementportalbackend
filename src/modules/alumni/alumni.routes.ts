import { Router } from 'express';
import * as controller from './alumni.controller.ts';
import { requireAuth, requireRole } from '../../middleware/authenticate.ts';

export const alumniRouter = Router();

// --- Profiles ---
alumniRouter.get('/profiles', requireAuth, controller.listProfiles);
alumniRouter.post('/profiles', requireAuth, requireRole('ADMIN', 'COORDINATOR'), controller.createProfile);
alumniRouter.patch('/profiles/:id', requireAuth, requireRole('ADMIN', 'COORDINATOR'), controller.updateProfile);

// --- Requests ---
alumniRouter.get('/requests', requireAuth, controller.listRequests);
alumniRouter.post('/requests/mentorship', requireAuth, requireRole('STUDENT'), controller.requestMentorship);
alumniRouter.post('/requests/referral', requireAuth, requireRole('STUDENT'), controller.requestReferral);
alumniRouter.patch('/requests/:type/:id/status', requireAuth, requireRole('ADMIN', 'COORDINATOR'), controller.updateRequestStatus);

// --- Stories ---
alumniRouter.get('/stories', requireAuth, controller.listStories);
alumniRouter.post('/stories', requireAuth, requireRole('ADMIN', 'COORDINATOR'), controller.createStory);
alumniRouter.patch('/stories/:id/status', requireAuth, requireRole('ADMIN', 'COORDINATOR'), controller.updateStoryStatus);
