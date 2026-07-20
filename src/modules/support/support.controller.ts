import type { RequestHandler } from 'express';
import * as ticketService from './ticket.service.ts';
import * as surveyService from './survey.service.ts';
import {
  resourceIdParam,
  createTicketBody,
  updateTicketStatusBody,
  addCommentBody,
  createSurveyBody,
  addQuestionBody,
  submitResponseBody,
} from './support.schema.ts';

// --- Tickets ---

export const listTickets: RequestHandler = async (req, res) => {
  res.json({ data: await ticketService.listTickets(req.user) });
};

export const getTicketById: RequestHandler = async (req, res) => {
  const { id } = resourceIdParam.parse(req.params);
  res.json({ data: await ticketService.getTicketById(id, req.user) });
};

export const createTicket: RequestHandler = async (req, res) => {
  const body = createTicketBody.parse(req.body);
  res.status(201).json({ data: await ticketService.createTicket(body, req.user) });
};

export const updateTicketStatus: RequestHandler = async (req, res) => {
  const { id } = resourceIdParam.parse(req.params);
  const body = updateTicketStatusBody.parse(req.body);
  res.json({ data: await ticketService.updateTicketStatus(id, body, req.user) });
};

export const addTicketComment: RequestHandler = async (req, res) => {
  const { id } = resourceIdParam.parse(req.params);
  const body = addCommentBody.parse(req.body);
  res.status(201).json({ data: await ticketService.addComment(id, body, req.user) });
};

// --- Surveys ---

export const listSurveys: RequestHandler = async (req, res) => {
  res.json({ data: await surveyService.listSurveys(req.user) });
};

export const getSurveyById: RequestHandler = async (req, res) => {
  const { id } = resourceIdParam.parse(req.params);
  res.json({ data: await surveyService.getSurveyById(id, req.user) });
};

export const createSurvey: RequestHandler = async (req, res) => {
  const body = createSurveyBody.parse(req.body);
  res.status(201).json({ data: await surveyService.createSurvey(body, req.user) });
};

export const addSurveyQuestion: RequestHandler = async (req, res) => {
  const { id } = resourceIdParam.parse(req.params);
  const body = addQuestionBody.parse(req.body);
  res.status(201).json({ data: await surveyService.addQuestion(id, body, req.user) });
};

export const submitSurveyResponse: RequestHandler = async (req, res) => {
  const { id } = resourceIdParam.parse(req.params);
  const body = submitResponseBody.parse(req.body);
  res.status(201).json({ data: await surveyService.submitResponse(id, body, req.user) });
};
