import { Router } from 'express';
import * as controller from './training.controller.ts';
import { requireAuth, requireRole } from '../../middleware/authenticate.ts';

export const trainingRouter = Router();

// --- Courses ---
trainingRouter.get('/courses', requireAuth, controller.listCourses);
trainingRouter.post('/courses', requireAuth, requireRole('ADMIN', 'COORDINATOR'), controller.createCourse);
trainingRouter.patch('/courses/:id/status', requireAuth, requireRole('ADMIN', 'COORDINATOR'), controller.toggleCourseStatus);
trainingRouter.post('/courses/:id/enroll', requireAuth, requireRole('STUDENT'), controller.enrollInCourse);
trainingRouter.patch('/courses/:id/progress', requireAuth, requireRole('STUDENT'), controller.updateEnrollmentProgress);

// --- Resources ---
trainingRouter.get('/resources', requireAuth, controller.listResources);
trainingRouter.post('/resources', requireAuth, requireRole('ADMIN', 'COORDINATOR'), controller.createResource);

// --- Mock Interviews ---
trainingRouter.get('/interviews', requireAuth, controller.listInterviews);
trainingRouter.post('/interviews', requireAuth, requireRole('STUDENT'), controller.bookInterview);
trainingRouter.patch('/interviews/:id/score', requireAuth, requireRole('ADMIN', 'COORDINATOR', 'FACULTY'), controller.scoreInterview);
