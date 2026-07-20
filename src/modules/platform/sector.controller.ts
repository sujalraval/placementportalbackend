import type { RequestHandler } from 'express';
import * as service from './sector.service.ts';
import { createSectorBody, sectorIdParam, updateSectorBody } from './sector.schema.ts';

export const list: RequestHandler = async (_req, res) => {
  res.json({ data: await service.listSectors() });
};

export const getById: RequestHandler = async (req, res) => {
  const { id } = sectorIdParam.parse(req.params);
  res.json({ data: await service.getSectorById(id) });
};

export const create: RequestHandler = async (req, res) => {
  const body = createSectorBody.parse(req.body);
  res.status(201).json({ data: await service.createSector(body) });
};

export const update: RequestHandler = async (req, res) => {
  const { id } = sectorIdParam.parse(req.params);
  const body = updateSectorBody.parse(req.body);
  res.json({ data: await service.updateSector(id, body) });
};

export const remove: RequestHandler = async (req, res) => {
  const { id } = sectorIdParam.parse(req.params);
  await service.deleteSector(id);
  res.status(204).send();
};
