import { Router } from 'express';
import * as controller from './support.controller.ts';
import { requireAuth, requireRole } from '../../middleware/authenticate.ts';

export const supportRouter = Router();

// --- Tickets ---

supportRouter.get('/tickets', requireAuth, controller.listTickets);
supportRouter.get('/tickets/:id', requireAuth, controller.getTicketById);
supportRouter.post('/tickets', requireAuth, controller.createTicket);
supportRouter.patch('/tickets/:id/status', requireAuth, requireRole('ADMIN', 'COORDINATOR'), controller.updateTicketStatus);
supportRouter.post('/tickets/:id/comments', requireAuth, controller.addTicketComment);

// --- Surveys ---

supportRouter.get('/surveys', requireAuth, controller.listSurveys);
supportRouter.get('/surveys/:id', requireAuth, controller.getSurveyById);
supportRouter.post('/surveys', requireAuth, requireRole('ADMIN', 'COORDINATOR'), controller.createSurvey);
supportRouter.post('/surveys/:id/questions', requireAuth, requireRole('ADMIN', 'COORDINATOR'), controller.addSurveyQuestion);
supportRouter.post('/surveys/:id/responses', requireAuth, controller.submitSurveyResponse);
