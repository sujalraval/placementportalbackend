import { Router } from 'express';
import * as controller from './internship.controller.ts';
import { requireAuth, requireRole } from '../../middleware/authenticate.ts';

export const internshipRouter = Router();

// Postings
internshipRouter.get('/postings', requireAuth, controller.listPostings);
internshipRouter.get('/postings/:id', requireAuth, controller.getPostingById);
internshipRouter.post('/postings', requireAuth, requireRole('ADMIN', 'COORDINATOR', 'RECRUITER'), controller.createPosting);
internshipRouter.patch('/postings/:id', requireAuth, requireRole('ADMIN', 'COORDINATOR', 'RECRUITER'), controller.updatePosting);
internshipRouter.patch('/postings/:id/status', requireAuth, requireRole('ADMIN', 'COORDINATOR', 'RECRUITER'), controller.updatePostingStatus);

// Internships (Trackers)
internshipRouter.get('/me', requireAuth, requireRole('STUDENT'), controller.getMyInternships);
internshipRouter.get('/', requireAuth, requireRole('ADMIN', 'COORDINATOR', 'RECRUITER', 'FACULTY'), controller.listInternships);
internshipRouter.post('/apply', requireAuth, requireRole('STUDENT'), controller.apply);
internshipRouter.patch('/:id/stage', requireAuth, requireRole('ADMIN', 'COORDINATOR', 'RECRUITER'), controller.updateStage);

// Approval Flow
internshipRouter.post('/:id/approval', requireAuth, requireRole('STUDENT'), controller.requestApproval);
internshipRouter.patch('/:id/approval', requireAuth, requireRole('ADMIN', 'COORDINATOR'), controller.decideApproval);

// Reports & Evaluation
internshipRouter.post('/:id/report', requireAuth, requireRole('STUDENT'), controller.submitReport);
internshipRouter.patch('/:id/evaluate', requireAuth, requireRole('FACULTY'), controller.evaluateInternship);
