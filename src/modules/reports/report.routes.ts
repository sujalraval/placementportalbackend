import { Router } from 'express';
import * as controller from './report.controller.ts';
import { requireAuth, requireRole } from '../../middleware/authenticate.ts';

export const reportRouter = Router();

// Reports are strictly admin/coordinator only.
reportRouter.use(requireAuth, requireRole('ADMIN', 'COORDINATOR'));

reportRouter.get('/dashboard', controller.getDashboardStats);
reportRouter.get('/analytics/placements', controller.getPlacementAnalytics);
reportRouter.get('/analytics/readiness', controller.getStudentReadiness);
reportRouter.get('/audit-logs', controller.getAuditLogs);
reportRouter.get('/analytics/funnel', controller.getSelectionFunnel);
