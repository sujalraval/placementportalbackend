import type { RequestHandler } from 'express';
import * as profileService from './profile.service.ts';
import * as requestService from './request.service.ts';
import * as storyService from './story.service.ts';
import {
  alumniIdParam,
  requestTypeParam,
  createAlumniBody,
  updateAlumniBody,
  createMentorshipRequestBody,
  createReferralRequestBody,
  updateRequestStatusBody,
  createSuccessStoryBody,
  updateStoryStatusBody,
} from './alumni.schema.ts';

// --- Profiles ---

export const listProfiles: RequestHandler = async (req, res) => {
  res.json({ data: await profileService.listProfiles(req.query, req.user) });
};

export const createProfile: RequestHandler = async (req, res) => {
  const body = createAlumniBody.parse(req.body);
  res.status(201).json({ data: await profileService.createProfile(body, req.user) });
};

export const updateProfile: RequestHandler = async (req, res) => {
  const { id } = alumniIdParam.parse(req.params);
  const body = updateAlumniBody.parse(req.body);
  res.json({ data: await profileService.updateProfile(id, body, req.user) });
};

// --- Requests ---

export const listRequests: RequestHandler = async (req, res) => {
  res.json({ data: await requestService.listRequests(req.user) });
};

export const requestMentorship: RequestHandler = async (req, res) => {
  const body = createMentorshipRequestBody.parse(req.body);
  res.status(201).json({ data: await requestService.createMentorshipRequest(body, req.user) });
};

export const requestReferral: RequestHandler = async (req, res) => {
  const body = createReferralRequestBody.parse(req.body);
  res.status(201).json({ data: await requestService.createReferralRequest(body, req.user) });
};

export const updateRequestStatus: RequestHandler = async (req, res) => {
  const { type, id } = requestTypeParam.parse(req.params);
  const body = updateRequestStatusBody.parse(req.body);
  res.json({ data: await requestService.updateRequestStatus(type, id, body, req.user) });
};

// --- Stories ---

export const listStories: RequestHandler = async (req, res) => {
  res.json({ data: await storyService.listStories(req.user) });
};

export const createStory: RequestHandler = async (req, res) => {
  const body = createSuccessStoryBody.parse(req.body);
  res.status(201).json({ data: await storyService.createStory(body, req.user) });
};

export const updateStoryStatus: RequestHandler = async (req, res) => {
  const { id } = alumniIdParam.parse(req.params);
  const body = updateStoryStatusBody.parse(req.body);
  res.json({ data: await storyService.updateStoryStatus(id, body, req.user) });
};
