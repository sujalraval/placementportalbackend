import type { RequestHandler } from 'express';
import * as reportService from './report.service.ts';

export const getDashboardStats: RequestHandler = async (req, res) => {
  res.json({ data: await reportService.getDashboardStats() });
};

export const getPlacementAnalytics: RequestHandler = async (req, res) => {
  const batchYear = req.query.batchYear ? parseInt(req.query.batchYear as string) : undefined;
  res.json({ data: await reportService.getPlacementAnalytics(batchYear) });
};

export const getStudentReadiness: RequestHandler = async (req, res) => {
  const batchYear = req.query.batchYear ? parseInt(req.query.batchYear as string) : undefined;
  res.json({ data: await reportService.getStudentReadiness(batchYear) });
};

export const getAuditLogs: RequestHandler = async (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
  res.json({ data: await reportService.getAuditLogs(limit) });
};
