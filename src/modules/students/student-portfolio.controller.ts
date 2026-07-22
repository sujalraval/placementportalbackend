import type { RequestHandler } from 'express';
import * as service from './student-portfolio.service.ts';
import { currentStudentId } from '../../middleware/authenticate.ts';
import {
  addSkillBody,
  createAchievementBody,
  createCertificationBody,
  createExperienceBody,
  createLinkBody,
  createPositionBody,
  createProjectBody,
  itemIdParam,
  updateAchievementBody,
  updateCertificationBody,
  updateExperienceBody,
  updatePositionBody,
  updateProjectBody,
  updateSkillBody,
  upsertSemesterRecordBody,
} from './student-portfolio.schema.ts';
import { z } from 'zod';

/// Every handler here is self-service — resolves the caller's own studentId
/// from the token and never accepts one from the URL. Staff read this data
/// through the full profile on GET /students/:id instead.

// --- Links -------------------------------------------------------------------

export const listLinks: RequestHandler = async (req, res) => {
  res.json({ data: await service.listLinks(currentStudentId(req.user)) });
};

export const createLink: RequestHandler = async (req, res) => {
  const body = createLinkBody.parse(req.body);
  res.status(201).json({ data: await service.createLink(currentStudentId(req.user), body) });
};

export const deleteLink: RequestHandler = async (req, res) => {
  const { itemId } = itemIdParam.parse(req.params);
  await service.deleteLink(currentStudentId(req.user), itemId);
  res.status(204).send();
};

// --- Skills --------------------------------------------------------------

export const listSkills: RequestHandler = async (req, res) => {
  res.json({ data: await service.listSkills(currentStudentId(req.user)) });
};

export const addSkill: RequestHandler = async (req, res) => {
  const body = addSkillBody.parse(req.body);
  res.status(201).json({ data: await service.addSkill(currentStudentId(req.user), body) });
};

const skillIdParam = z.object({ skillId: z.uuid('Not a valid skill id') });

export const updateSkill: RequestHandler = async (req, res) => {
  const { skillId } = skillIdParam.parse(req.params);
  const body = updateSkillBody.parse(req.body);
  res.json({ data: await service.updateSkillProficiency(currentStudentId(req.user), skillId, body) });
};

export const removeSkill: RequestHandler = async (req, res) => {
  const { skillId } = skillIdParam.parse(req.params);
  await service.removeSkill(currentStudentId(req.user), skillId);
  res.status(204).send();
};

// --- Projects ------------------------------------------------------------

export const listProjects: RequestHandler = async (req, res) => {
  res.json({ data: await service.listProjects(currentStudentId(req.user)) });
};

export const createProject: RequestHandler = async (req, res) => {
  const body = createProjectBody.parse(req.body);
  res.status(201).json({ data: await service.createProject(currentStudentId(req.user), body) });
};

export const updateProject: RequestHandler = async (req, res) => {
  const { itemId } = itemIdParam.parse(req.params);
  const body = updateProjectBody.parse(req.body);
  res.json({ data: await service.updateProject(currentStudentId(req.user), itemId, body) });
};

export const deleteProject: RequestHandler = async (req, res) => {
  const { itemId } = itemIdParam.parse(req.params);
  await service.deleteProject(currentStudentId(req.user), itemId);
  res.status(204).send();
};

// --- Experience ------------------------------------------------------------

export const listExperiences: RequestHandler = async (req, res) => {
  res.json({ data: await service.listExperiences(currentStudentId(req.user)) });
};

export const createExperience: RequestHandler = async (req, res) => {
  const body = createExperienceBody.parse(req.body);
  res.status(201).json({ data: await service.createExperience(currentStudentId(req.user), body) });
};

export const updateExperience: RequestHandler = async (req, res) => {
  const { itemId } = itemIdParam.parse(req.params);
  const body = updateExperienceBody.parse(req.body);
  res.json({ data: await service.updateExperience(currentStudentId(req.user), itemId, body) });
};

export const deleteExperience: RequestHandler = async (req, res) => {
  const { itemId } = itemIdParam.parse(req.params);
  await service.deleteExperience(currentStudentId(req.user), itemId);
  res.status(204).send();
};

// --- Certifications --------------------------------------------------------

export const listCertifications: RequestHandler = async (req, res) => {
  res.json({ data: await service.listCertifications(currentStudentId(req.user)) });
};

export const createCertification: RequestHandler = async (req, res) => {
  const body = createCertificationBody.parse(req.body);
  res
    .status(201)
    .json({ data: await service.createCertification(currentStudentId(req.user), body) });
};

export const updateCertification: RequestHandler = async (req, res) => {
  const { itemId } = itemIdParam.parse(req.params);
  const body = updateCertificationBody.parse(req.body);
  res.json({ data: await service.updateCertification(currentStudentId(req.user), itemId, body) });
};

export const deleteCertification: RequestHandler = async (req, res) => {
  const { itemId } = itemIdParam.parse(req.params);
  await service.deleteCertification(currentStudentId(req.user), itemId);
  res.status(204).send();
};

// --- Achievements ------------------------------------------------------------

export const listAchievements: RequestHandler = async (req, res) => {
  res.json({ data: await service.listAchievements(currentStudentId(req.user)) });
};

export const createAchievement: RequestHandler = async (req, res) => {
  const body = createAchievementBody.parse(req.body);
  res.status(201).json({ data: await service.createAchievement(currentStudentId(req.user), body) });
};

export const updateAchievement: RequestHandler = async (req, res) => {
  const { itemId } = itemIdParam.parse(req.params);
  const body = updateAchievementBody.parse(req.body);
  res.json({ data: await service.updateAchievement(currentStudentId(req.user), itemId, body) });
};

export const deleteAchievement: RequestHandler = async (req, res) => {
  const { itemId } = itemIdParam.parse(req.params);
  await service.deleteAchievement(currentStudentId(req.user), itemId);
  res.status(204).send();
};

// --- Positions of responsibility --------------------------------------------

export const listPositions: RequestHandler = async (req, res) => {
  res.json({ data: await service.listPositions(currentStudentId(req.user)) });
};

export const createPosition: RequestHandler = async (req, res) => {
  const body = createPositionBody.parse(req.body);
  res.status(201).json({ data: await service.createPosition(currentStudentId(req.user), body) });
};

export const updatePosition: RequestHandler = async (req, res) => {
  const { itemId } = itemIdParam.parse(req.params);
  const body = updatePositionBody.parse(req.body);
  res.json({ data: await service.updatePosition(currentStudentId(req.user), itemId, body) });
};

export const deletePosition: RequestHandler = async (req, res) => {
  const { itemId } = itemIdParam.parse(req.params);
  await service.deletePosition(currentStudentId(req.user), itemId);
  res.status(204).send();
};

// --- Semester records --------------------------------------------------------

export const listSemesterRecords: RequestHandler = async (req, res) => {
  res.json({ data: await service.listSemesterRecords(currentStudentId(req.user)) });
};

export const upsertSemesterRecord: RequestHandler = async (req, res) => {
  const body = upsertSemesterRecordBody.parse(req.body);
  res.json({ data: await service.upsertSemesterRecord(currentStudentId(req.user), body) });
};

const semesterParam = z.object({ semester: z.coerce.number().int().min(1).max(20) });

export const deleteSemesterRecord: RequestHandler = async (req, res) => {
  const { semester } = semesterParam.parse(req.params);
  await service.deleteSemesterRecord(currentStudentId(req.user), semester);
  res.status(204).send();
};
