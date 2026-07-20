import type { RequestHandler } from 'express';
import * as courseService from './course.service.ts';
import * as resourceService from './resource.service.ts';
import * as interviewService from './interview.service.ts';
import {
  trainingIdParam,
  createCourseBody,
  updateProgressBody,
  createResourceBody,
  bookInterviewBody,
  scoreInterviewBody,
} from './training.schema.ts';

// --- Courses ---

export const listCourses: RequestHandler = async (req, res) => {
  res.json({ data: await courseService.listCourses(req.user) });
};

export const createCourse: RequestHandler = async (req, res) => {
  const body = createCourseBody.parse(req.body);
  res.status(201).json({ data: await courseService.createCourse(body, req.user) });
};

export const toggleCourseStatus: RequestHandler = async (req, res) => {
  const { id } = trainingIdParam.parse(req.params);
  res.json({ data: await courseService.toggleCourseStatus(id, req.user) });
};

export const enrollInCourse: RequestHandler = async (req, res) => {
  const { id } = trainingIdParam.parse(req.params);
  res.status(201).json({ data: await courseService.enrollInCourse(id, req.user) });
};

export const updateEnrollmentProgress: RequestHandler = async (req, res) => {
  const { id } = trainingIdParam.parse(req.params);
  const body = updateProgressBody.parse(req.body);
  res.json({ data: await courseService.updateEnrollmentProgress(id, body, req.user) });
};

// --- Resources ---

export const listResources: RequestHandler = async (req, res) => {
  res.json({ data: await resourceService.listResources(req.user) });
};

export const createResource: RequestHandler = async (req, res) => {
  const body = createResourceBody.parse(req.body);
  res.status(201).json({ data: await resourceService.createResource(body, req.user) });
};

// --- Mock Interviews ---

export const listInterviews: RequestHandler = async (req, res) => {
  res.json({ data: await interviewService.listInterviews(req.user) });
};

export const bookInterview: RequestHandler = async (req, res) => {
  const body = bookInterviewBody.parse(req.body);
  res.status(201).json({ data: await interviewService.bookInterview(body, req.user) });
};

export const scoreInterview: RequestHandler = async (req, res) => {
  const { id } = trainingIdParam.parse(req.params);
  const body = scoreInterviewBody.parse(req.body);
  res.json({ data: await interviewService.scoreInterview(id, body, req.user) });
};
