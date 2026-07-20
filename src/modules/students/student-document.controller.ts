import type { RequestHandler } from 'express';
import * as service from './student-document.service.ts';
import { currentStudentId } from '../../middleware/authenticate.ts';
import { documentIdParam, uploadDocumentBody } from './student-document.schema.ts';

export const list: RequestHandler = async (req, res) => {
  res.json({ data: await service.listDocuments(currentStudentId(req.user)) });
};

export const upload: RequestHandler = async (req, res) => {
  const body = uploadDocumentBody.parse(req.body);
  res.status(201).json({ data: await service.uploadDocument(currentStudentId(req.user), body) });
};

export const remove: RequestHandler = async (req, res) => {
  const { id } = documentIdParam.parse(req.params);
  await service.deleteDocument(currentStudentId(req.user), id);
  res.status(204).send();
};
