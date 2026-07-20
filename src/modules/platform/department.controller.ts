import type { RequestHandler } from 'express';
import * as service from './department.service.ts';
import {
  createDepartmentBody,
  departmentIdParam,
  listDepartmentsQuery,
  updateDepartmentBody,
} from './department.schema.ts';

/// HTTP in, HTTP out. Parses with zod, calls the service, picks a status code.
/// No domain rules live here — anything that decides *what happens* belongs in
/// department.service.ts.
///
/// Express 5 forwards a rejected promise from a handler to the error
/// middleware on its own, so these need no try/catch and no asyncHandler wrap.

export const list: RequestHandler = async (req, res) => {
  const { withStats } = listDepartmentsQuery.parse(req.query);
  res.json({ data: await service.listDepartments(withStats) });
};

export const getById: RequestHandler = async (req, res) => {
  const { id } = departmentIdParam.parse(req.params);
  res.json({ data: await service.getDepartmentById(id) });
};

export const create: RequestHandler = async (req, res) => {
  const body = createDepartmentBody.parse(req.body);
  res.status(201).json({ data: await service.createDepartment(body) });
};

export const update: RequestHandler = async (req, res) => {
  const { id } = departmentIdParam.parse(req.params);
  const body = updateDepartmentBody.parse(req.body);
  res.json({ data: await service.updateDepartment(id, body) });
};

export const remove: RequestHandler = async (req, res) => {
  const { id } = departmentIdParam.parse(req.params);
  await service.deleteDepartment(id);
  res.status(204).send();
};
