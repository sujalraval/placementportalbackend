import type { RequestHandler } from 'express';
import * as service from './user.service.ts';
import {
  createStaffUserBody,
  listUsersQuery,
  setUserStatusBody,
  updateUserBody,
  userIdParam,
} from './user.schema.ts';

export const list: RequestHandler = async (req, res) => {
  const query = listUsersQuery.parse(req.query);
  const { users, pagination } = await service.listUsers(query);
  res.json({ data: users, pagination });
};

export const getById: RequestHandler = async (req, res) => {
  const { id } = userIdParam.parse(req.params);
  res.json({ data: await service.getUserById(id) });
};

export const create: RequestHandler = async (req, res) => {
  const body = createStaffUserBody.parse(req.body);
  res.status(201).json({ data: await service.createStaffUser(body) });
};

export const update: RequestHandler = async (req, res) => {
  const { id } = userIdParam.parse(req.params);
  const body = updateUserBody.parse(req.body);
  res.json({ data: await service.updateUser(id, body) });
};

export const setStatus: RequestHandler = async (req, res) => {
  const { id } = userIdParam.parse(req.params);
  const body = setUserStatusBody.parse(req.body);
  res.json({ data: await service.setUserStatus(id, body) });
};

export const remove: RequestHandler = async (req, res) => {
  const { id } = userIdParam.parse(req.params);
  await service.deleteUser(id);
  res.status(204).send();
};
