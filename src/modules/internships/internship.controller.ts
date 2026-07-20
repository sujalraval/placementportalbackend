import type { RequestHandler } from 'express';
import * as service from './internship.service.ts';
import {
  internshipPostingIdParam,
  internshipIdParam,
  getInternshipsQuery,
  createInternshipPostingBody,
  updateInternshipPostingBody,
  updateInternshipPostingStatusBody,
  applyInternshipBody,
  updateInternshipStageBody,
  requestApprovalBody,
  decideApprovalBody,
  submitReportBody,
  evaluateInternshipBody,
} from './internship.schema.ts';

// --- Postings ---

export const listPostings: RequestHandler = async (req, res) => {
  res.json({ data: await service.listPostings(req.user) });
};

export const getPostingById: RequestHandler = async (req, res) => {
  const { id } = internshipPostingIdParam.parse(req.params);
  res.json({ data: await service.getPostingById(id, req.user) });
};

export const createPosting: RequestHandler = async (req, res) => {
  const body = createInternshipPostingBody.parse(req.body);
  res.status(201).json({ data: await service.createPosting(body, req.user) });
};

export const updatePosting: RequestHandler = async (req, res) => {
  const { id } = internshipPostingIdParam.parse(req.params);
  const body = updateInternshipPostingBody.parse(req.body);
  res.json({ data: await service.updatePosting(id, body, req.user) });
};

export const updatePostingStatus: RequestHandler = async (req, res) => {
  const { id } = internshipPostingIdParam.parse(req.params);
  const body = updateInternshipPostingStatusBody.parse(req.body);
  res.json({ data: await service.updatePostingStatus(id, body, req.user) });
};

// --- Internships ---

export const listInternships: RequestHandler = async (req, res) => {
  const query = getInternshipsQuery.parse(req.query);
  res.json({ data: await service.listInternships(req.user, query.internshipPostingId) });
};

export const getMyInternships: RequestHandler = async (req, res) => {
  res.json({ data: await service.getMyInternships(req.user) });
};

export const apply: RequestHandler = async (req, res) => {
  const body = applyInternshipBody.parse(req.body);
  res.status(201).json({ data: await service.applyForInternship(body, req.user) });
};

export const updateStage: RequestHandler = async (req, res) => {
  const { id } = internshipIdParam.parse(req.params);
  const body = updateInternshipStageBody.parse(req.body);
  res.json({ data: await service.updateStage(id, body, req.user) });
};

// --- Approval Flow ---

export const requestApproval: RequestHandler = async (req, res) => {
  const { id } = internshipIdParam.parse(req.params);
  const body = requestApprovalBody.parse(req.body);
  res.status(201).json({ data: await service.requestApproval(id, body, req.user) });
};

export const decideApproval: RequestHandler = async (req, res) => {
  const { id } = internshipIdParam.parse(req.params);
  const body = decideApprovalBody.parse(req.body);
  res.json({ data: await service.decideApproval(id, body, req.user) });
};

// --- Reports ---

export const submitReport: RequestHandler = async (req, res) => {
  const { id } = internshipIdParam.parse(req.params);
  const body = submitReportBody.parse(req.body);
  res.status(201).json({ data: await service.submitReport(id, body, req.user) });
};

export const evaluateInternship: RequestHandler = async (req, res) => {
  const { id } = internshipIdParam.parse(req.params);
  const body = evaluateInternshipBody.parse(req.body);
  res.json({ data: await service.evaluateInternship(id, body, req.user) });
};
