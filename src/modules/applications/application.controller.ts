import type { RequestHandler } from 'express';
import * as service from './application.service.ts';
import {
  applicationIdParam,
  applicationRoundIdParam,
  interviewIdParam,
  getApplicationsQuery,
  createApplicationBody,
  updateApplicationStatusBody,
  evaluateRoundBody,
  scheduleInterviewBody,
  updateInterviewOutcomeBody,
  releaseOfferBody,
  revokeOfferBody,
  respondOfferBody,
} from './application.schema.ts';

export const list: RequestHandler = async (req, res) => {
  const query = getApplicationsQuery.parse(req.query);
  res.json({ data: await service.listApplications(req.user, query.jobPostingId) });
};

export const listMine: RequestHandler = async (req, res) => {
  res.json({ data: await service.getMyApplications(req.user) });
};

export const apply: RequestHandler = async (req, res) => {
  const body = createApplicationBody.parse(req.body);
  res.status(201).json({ data: await service.applyForJob(body, req.user) });
};

export const updateStatus: RequestHandler = async (req, res) => {
  const { id } = applicationIdParam.parse(req.params);
  const body = updateApplicationStatusBody.parse(req.body);
  res.json({ data: await service.updateStatus(id, body, req.user) });
};

export const evaluateRound: RequestHandler = async (req, res) => {
  const { id } = applicationIdParam.parse(req.params);
  const body = evaluateRoundBody.parse(req.body);
  res.json({ data: await service.evaluateRound(id, body, req.user) });
};

export const scheduleInterview: RequestHandler = async (req, res) => {
  const { id } = applicationIdParam.parse(req.params);
  const body = scheduleInterviewBody.parse(req.body);
  res.status(201).json({ data: await service.scheduleInterview(id, body, req.user) });
};

export const updateInterview: RequestHandler = async (req, res) => {
  const { id, interviewId } = interviewIdParam.parse(req.params);
  const body = updateInterviewOutcomeBody.parse(req.body);
  res.json({ data: await service.updateInterview(id, interviewId, body, req.user) });
};

export const releaseOffer: RequestHandler = async (req, res) => {
  const { id } = applicationIdParam.parse(req.params);
  const body = releaseOfferBody.parse(req.body);
  res.status(201).json({ data: await service.releaseOffer(id, body, req.user) });
};

export const revokeOffer: RequestHandler = async (req, res) => {
  const { id } = applicationIdParam.parse(req.params);
  const body = revokeOfferBody.parse(req.body);
  res.json({ data: await service.revokeOffer(id, body, req.user) });
};

export const respondToOffer: RequestHandler = async (req, res) => {
  const { id } = applicationIdParam.parse(req.params);
  const body = respondOfferBody.parse(req.body);
  res.json({ data: await service.respondToOffer(id, body, req.user) });
};
