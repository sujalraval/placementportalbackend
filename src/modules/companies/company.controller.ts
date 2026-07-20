import type { RequestHandler } from 'express';
import * as service from './company.service.ts';
import {
  companyIdParam,
  contactIdParam,
  createCompanyBody,
  updateCompanyBody,
  createContactBody,
  updateContactBody,
  upsertMouBody,
  verifyCompanyBody,
} from './company.schema.ts';

export const list: RequestHandler = async (req, res) => {
  res.json({ data: await service.listCompanies(req.user) });
};

export const getById: RequestHandler = async (req, res) => {
  const { id } = companyIdParam.parse(req.params);
  res.json({ data: await service.getCompanyById(id, req.user) });
};

export const create: RequestHandler = async (req, res) => {
  const body = createCompanyBody.parse(req.body);
  res.status(201).json({ data: await service.createCompany(body, req.user) });
};

export const update: RequestHandler = async (req, res) => {
  const { id } = companyIdParam.parse(req.params);
  const body = updateCompanyBody.parse(req.body);
  res.json({ data: await service.updateCompany(id, body, req.user) });
};

export const verify: RequestHandler = async (req, res) => {
  const { id } = companyIdParam.parse(req.params);
  const body = verifyCompanyBody.parse(req.body);
  res.json({ data: await service.verifyCompany(id, body, req.user) });
};

export const listContacts: RequestHandler = async (req, res) => {
  const { id } = companyIdParam.parse(req.params);
  res.json({ data: await service.listContacts(id, req.user) });
};

export const addContact: RequestHandler = async (req, res) => {
  const { id } = companyIdParam.parse(req.params);
  const body = createContactBody.parse(req.body);
  res.status(201).json({ data: await service.addContact(id, body, req.user) });
};

export const updateContact: RequestHandler = async (req, res) => {
  const { id, contactId } = contactIdParam.parse(req.params);
  const body = updateContactBody.parse(req.body);
  res.json({ data: await service.updateContact(id, contactId, body, req.user) });
};

export const removeContact: RequestHandler = async (req, res) => {
  const { id, contactId } = contactIdParam.parse(req.params);
  await service.removeContact(id, contactId, req.user);
  res.status(204).send();
};

export const getMou: RequestHandler = async (req, res) => {
  const { id } = companyIdParam.parse(req.params);
  res.json({ data: await service.getMou(id, req.user) });
};

export const upsertMou: RequestHandler = async (req, res) => {
  const { id } = companyIdParam.parse(req.params);
  const body = upsertMouBody.parse(req.body);
  res.json({ data: await service.upsertMou(id, body, req.user) });
};
