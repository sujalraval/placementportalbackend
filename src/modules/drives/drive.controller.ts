import type { RequestHandler } from 'express';
import * as service from './drive.service.ts';
import {
  driveIdParam,
  driveStudentIdParam,
  createDriveBody,
  updateDriveBody,
  updateDriveStatusBody,
  markAttendanceBody,
} from './drive.schema.ts';

export const list: RequestHandler = async (req, res) => {
  res.json({ data: await service.listDrives(req.user) });
};

export const getById: RequestHandler = async (req, res) => {
  const { id } = driveIdParam.parse(req.params);
  res.json({ data: await service.getDriveById(id, req.user) });
};

export const create: RequestHandler = async (req, res) => {
  const body = createDriveBody.parse(req.body);
  res.status(201).json({ data: await service.createDrive(body, req.user) });
};

export const update: RequestHandler = async (req, res) => {
  const { id } = driveIdParam.parse(req.params);
  const body = updateDriveBody.parse(req.body);
  res.json({ data: await service.updateDrive(id, body, req.user) });
};

export const updateStatus: RequestHandler = async (req, res) => {
  const { id } = driveIdParam.parse(req.params);
  const body = updateDriveStatusBody.parse(req.body);
  res.json({ data: await service.updateDriveStatus(id, body, req.user) });
};

export const register: RequestHandler = async (req, res) => {
  const { id } = driveIdParam.parse(req.params);
  res.status(201).json({ data: await service.registerForDrive(id, req.user) });
};

export const listRegistrations: RequestHandler = async (req, res) => {
  const { id } = driveIdParam.parse(req.params);
  res.json({ data: await service.listRegistrations(id, req.user) });
};

export const markAttendance: RequestHandler = async (req, res) => {
  const { id, studentId } = driveStudentIdParam.parse(req.params);
  const body = markAttendanceBody.parse(req.body);
  res.json({ data: await service.markAttendance(id, studentId, body, req.user) });
};
