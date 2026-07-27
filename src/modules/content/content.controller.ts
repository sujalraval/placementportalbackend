import type { RequestHandler } from 'express';
import * as newsService from './news.service.ts';
import * as eventService from './event.service.ts';
import * as broadcastService from './broadcast.service.ts';
import {
  contentIdParam,
  contentSlugParam,
  createNewsBody,
  createEventBody,
  createBroadcastBody,
  updateContentStatusBody,
} from './content.schema.ts';
import { env } from '../../config/env.ts';

// --- Uploads ---

export const uploadFile: RequestHandler = (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: { message: 'No file uploaded' } });
    return;
  }
  // Construct the URL where the file can be accessed.
  // In production, env.API_URL or similar could be used.
  // We'll use a relative URL if both frontend and backend are on the same domain,
  // or a full URL if we have an API_BASE set. Assuming the frontend knows where the API is.
  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.status(201).json({ data: { url: fileUrl } });
};

// --- News ---

export const listNews: RequestHandler = async (req, res) => {
  res.json({ data: await newsService.listNews(req.user) });
};

export const getNews: RequestHandler = async (req, res) => {
  const { slug } = contentSlugParam.parse(req.params);
  res.json({ data: await newsService.getNewsBySlug(slug, req.user) });
};

export const createNews: RequestHandler = async (req, res) => {
  const body = createNewsBody.parse(req.body);
  res.status(201).json({ data: await newsService.createNews(body, req.user) });
};

export const updateNewsStatus: RequestHandler = async (req, res) => {
  const { id } = contentIdParam.parse(req.params);
  const body = updateContentStatusBody.parse(req.body);
  res.json({ data: await newsService.updateNewsStatus(id, body, req.user) });
};

// --- Events ---

export const listEvents: RequestHandler = async (req, res) => {
  res.json({ data: await eventService.listEvents(req.user) });
};

export const getEvent: RequestHandler = async (req, res) => {
  const { slug } = contentSlugParam.parse(req.params);
  res.json({ data: await eventService.getEventBySlug(slug, req.user) });
};

export const createEvent: RequestHandler = async (req, res) => {
  const body = createEventBody.parse(req.body);
  res.status(201).json({ data: await eventService.createEvent(body, req.user) });
};

export const updateEventStatus: RequestHandler = async (req, res) => {
  const { id } = contentIdParam.parse(req.params);
  const body = updateContentStatusBody.parse(req.body);
  res.json({ data: await eventService.updateEventStatus(id, body, req.user) });
};

export const registerForEvent: RequestHandler = async (req, res) => {
  const { id } = contentIdParam.parse(req.params);
  res.status(201).json({ data: await eventService.registerForEvent(id, req.user) });
};

export const listEventRegistrations: RequestHandler = async (req, res) => {
  const { id } = contentIdParam.parse(req.params);
  res.json({ data: await eventService.listRegistrations(id, req.user) });
};

// --- Broadcasts ---

export const listBroadcasts: RequestHandler = async (req, res) => {
  res.json({ data: await broadcastService.listBroadcasts(req.user) });
};

export const sendBroadcast: RequestHandler = async (req, res) => {
  const body = createBroadcastBody.parse(req.body);
  res.status(201).json({ data: await broadcastService.sendBroadcast(body, req.user) });
};
