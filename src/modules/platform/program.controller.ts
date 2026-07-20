import type { RequestHandler } from 'express';
import * as service from './program.service.ts';
import {
  createProgramBody,
  listProgramsQuery,
  programIdParam,
  updateProgramBody,
} from './program.schema.ts';

export const list: RequestHandler = async (req, res) => {
  const { departmentId } = listProgramsQuery.parse(req.query);
  res.json({ data: await service.listPrograms(departmentId) });
};

export const getById: RequestHandler = async (req, res) => {
  const { id } = programIdParam.parse(req.params);
  res.json({ data: await service.getProgramById(id) });
};

export const create: RequestHandler = async (req, res) => {
  const body = createProgramBody.parse(req.body);
  res.status(201).json({ data: await service.createProgram(body) });
};

export const update: RequestHandler = async (req, res) => {
  const { id } = programIdParam.parse(req.params);
  const body = updateProgramBody.parse(req.body);
  res.json({ data: await service.updateProgram(id, body) });
};

export const remove: RequestHandler = async (req, res) => {
  const { id } = programIdParam.parse(req.params);
  await service.deleteProgram(id);
  res.status(204).send();
};
