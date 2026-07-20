import type { RequestHandler } from 'express';
import * as service from './notification.service.ts';
import {
  notificationIdParam,
  getNotificationsQuery,
} from './notification.schema.ts';

export const listMine: RequestHandler = async (req, res) => {
  const query = getNotificationsQuery.parse(req.query);
  res.json({ data: await service.listMyNotifications(req.user, query.unreadOnly) });
};

export const markAsRead: RequestHandler = async (req, res) => {
  const { id } = notificationIdParam.parse(req.params);
  res.json({ data: await service.markAsRead(id, req.user) });
};

export const markAllAsRead: RequestHandler = async (req, res) => {
  await service.markAllAsRead(req.user);
  res.status(204).send();
};

export const processOutbox: RequestHandler = async (req, res) => {
  res.json({ data: await service.processOutbox(req.user) });
};
