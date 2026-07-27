import type { RequestHandler } from 'express';
import * as service from './student.service.ts';
import { ApiError } from '../../lib/http-error.ts';
import { currentStudentId, departmentScope } from '../../middleware/authenticate.ts';
import {
  academicRecordBody,
  listStudentsQuery,
  studentIdParam,
  updateOwnProfileBody,
  updatePlacementStatusBody,
  upsertPreferenceBody,
  importStudentsBody,
} from './student.schema.ts';

// --- Self-service ------------------------------------------------------------

export const getMe: RequestHandler = async (req, res) => {
  const studentId = currentStudentId(req.user);
  res.json({ data: await service.findStudentById(studentId) });
};

export const updateMe: RequestHandler = async (req, res) => {
  const studentId = currentStudentId(req.user);
  const body = updateOwnProfileBody.parse(req.body);
  res.json({ data: await service.updateOwnProfile(studentId, body) });
};

export const updateMyPlacementStatus: RequestHandler = async (req, res) => {
  const studentId = currentStudentId(req.user);
  const body = updatePlacementStatusBody.parse(req.body);
  res.json({ data: await service.updatePlacementStatus(studentId, body) });
};

export const upsertMyPreference: RequestHandler = async (req, res) => {
  const studentId = currentStudentId(req.user);
  const body = upsertPreferenceBody.parse(req.body);
  res.json({ data: await service.upsertPreference(studentId, body) });
};

// --- Staff (coordinator / admin) --------------------------------------------

export const list: RequestHandler = async (req, res) => {
  if (!req.user) throw ApiError.unauthorized();
  const query = listStudentsQuery.parse(req.query);
  // A coordinator's departmentId always wins over whatever they pass in the
  // query string — departmentScope() is the fence, not a suggestion.
  const scope = departmentScope(req.user);
  const { students, pagination } = await service.listStudents({
    ...query,
    ...(scope.departmentId ? { departmentId: scope.departmentId } : {}),
  });
  res.json({ data: students, pagination });
};

export const getById: RequestHandler = async (req, res) => {
  if (!req.user) throw ApiError.unauthorized();
  const { id } = studentIdParam.parse(req.params);
  res.json({ data: await service.getStudentById(id, req.user) });
};

export const updateAcademicRecord: RequestHandler = async (req, res) => {
  if (!req.user) throw ApiError.unauthorized();
  const { id } = studentIdParam.parse(req.params);
  await service.getStudentById(id, req.user); // enforces department scope, 404s if missing
  const body = academicRecordBody.parse(req.body);
  res.json({ data: await service.updateAcademicRecord(id, body) });
};

export const importStudents: RequestHandler = async (req, res) => {
  if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'COORDINATOR')) {
    throw ApiError.unauthorized();
  }
  const body = importStudentsBody.parse(req.body);
  const result = await service.importStudents(body);
  res.json({ data: result });
};
