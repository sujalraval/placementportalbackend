import type { RequestHandler } from 'express';
import * as service from './verification.service.ts';
import {
  verificationItemIdParam,
  submitVerificationBody,
  reviewVerificationBody,
} from './verification.schema.ts';

export const list: RequestHandler = async (req, res) => {
  res.json({ data: await service.listItems(req.user) });
};

export const listMine: RequestHandler = async (req, res) => {
  res.json({ data: await service.getMyItems(req.user) });
};

export const submit: RequestHandler = async (req, res) => {
  const body = submitVerificationBody.parse(req.body);
  res.status(201).json({ data: await service.submitItem(body, req.user) });
};

export const review: RequestHandler = async (req, res) => {
  const { id } = verificationItemIdParam.parse(req.params);
  const body = reviewVerificationBody.parse(req.body);
  res.json({ data: await service.reviewItem(id, body, req.user) });
};
