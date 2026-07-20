import type { RequestHandler } from 'express';
import * as service from './posting.service.ts';
import {
  postingIdParam,
  roundIdParam,
  createPostingBody,
  updatePostingBody,
  updatePostingStatusBody,
  createRoundBody,
  updateRoundBody,
} from './posting.schema.ts';

export const list: RequestHandler = async (req, res) => {
  res.json({ data: await service.listPostings(req.user) });
};

export const getById: RequestHandler = async (req, res) => {
  const { id } = postingIdParam.parse(req.params);
  res.json({ data: await service.getPostingById(id, req.user) });
};

export const create: RequestHandler = async (req, res) => {
  const body = createPostingBody.parse(req.body);
  res.status(201).json({ data: await service.createPosting(body, req.user) });
};

export const update: RequestHandler = async (req, res) => {
  const { id } = postingIdParam.parse(req.params);
  const body = updatePostingBody.parse(req.body);
  res.json({ data: await service.updatePosting(id, body, req.user) });
};

export const updateStatus: RequestHandler = async (req, res) => {
  const { id } = postingIdParam.parse(req.params);
  const body = updatePostingStatusBody.parse(req.body);
  res.json({ data: await service.updatePostingStatus(id, body, req.user) });
};

export const listRounds: RequestHandler = async (req, res) => {
  const { id } = postingIdParam.parse(req.params);
  res.json({ data: await service.listRounds(id, req.user) });
};

export const addRound: RequestHandler = async (req, res) => {
  const { id } = postingIdParam.parse(req.params);
  const body = createRoundBody.parse(req.body);
  res.status(201).json({ data: await service.addRound(id, body, req.user) });
};

export const updateRound: RequestHandler = async (req, res) => {
  const { id, roundId } = roundIdParam.parse(req.params);
  const body = updateRoundBody.parse(req.body);
  res.json({ data: await service.updateRound(id, roundId, body, req.user) });
};

export const removeRound: RequestHandler = async (req, res) => {
  const { id, roundId } = roundIdParam.parse(req.params);
  await service.removeRound(id, roundId, req.user);
  res.status(204).send();
};
