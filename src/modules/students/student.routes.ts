import { Router } from 'express';
import * as student from './student.controller.ts';
import * as portfolio from './student-portfolio.controller.ts';
import * as documents from './student-document.controller.ts';
import { requireAuth, requireRole } from '../../middleware/authenticate.ts';

export const studentRouter = Router();

studentRouter.use(requireAuth);

// --- Self-service: "My profile", its 7 tabs, and preferences ---------------
// All resolve the caller's own studentId from the token — never from the URL.
// This is what replaces the frontend's hardcoded Aarav Shah.
const self = requireRole('STUDENT');

studentRouter.get('/me', self, student.getMe);
studentRouter.patch('/me', self, student.updateMe);
studentRouter.patch('/me/placement-status', self, student.updateMyPlacementStatus);
studentRouter.put('/me/preference', self, student.upsertMyPreference);

studentRouter.get('/me/links', self, portfolio.listLinks);
studentRouter.post('/me/links', self, portfolio.createLink);
studentRouter.delete('/me/links/:itemId', self, portfolio.deleteLink);

studentRouter.get('/me/skills', self, portfolio.listSkills);
studentRouter.post('/me/skills', self, portfolio.addSkill);
studentRouter.patch('/me/skills/:skillId', self, portfolio.updateSkill);
studentRouter.delete('/me/skills/:skillId', self, portfolio.removeSkill);

studentRouter.get('/me/projects', self, portfolio.listProjects);
studentRouter.post('/me/projects', self, portfolio.createProject);
studentRouter.patch('/me/projects/:itemId', self, portfolio.updateProject);
studentRouter.delete('/me/projects/:itemId', self, portfolio.deleteProject);

studentRouter.get('/me/experience', self, portfolio.listExperiences);
studentRouter.post('/me/experience', self, portfolio.createExperience);
studentRouter.patch('/me/experience/:itemId', self, portfolio.updateExperience);
studentRouter.delete('/me/experience/:itemId', self, portfolio.deleteExperience);

studentRouter.get('/me/certifications', self, portfolio.listCertifications);
studentRouter.post('/me/certifications', self, portfolio.createCertification);
studentRouter.patch('/me/certifications/:itemId', self, portfolio.updateCertification);
studentRouter.delete('/me/certifications/:itemId', self, portfolio.deleteCertification);

studentRouter.get('/me/achievements', self, portfolio.listAchievements);
studentRouter.post('/me/achievements', self, portfolio.createAchievement);
studentRouter.patch('/me/achievements/:itemId', self, portfolio.updateAchievement);
studentRouter.delete('/me/achievements/:itemId', self, portfolio.deleteAchievement);

studentRouter.get('/me/positions', self, portfolio.listPositions);
studentRouter.post('/me/positions', self, portfolio.createPosition);
studentRouter.patch('/me/positions/:itemId', self, portfolio.updatePosition);
studentRouter.delete('/me/positions/:itemId', self, portfolio.deletePosition);

studentRouter.get('/me/semester-records', self, portfolio.listSemesterRecords);
studentRouter.put('/me/semester-records', self, portfolio.upsertSemesterRecord);
studentRouter.delete('/me/semester-records/:semester', self, portfolio.deleteSemesterRecord);

studentRouter.get('/me/documents', self, documents.list);
studentRouter.post('/me/documents', self, documents.upload);
studentRouter.delete('/me/documents/:id', self, documents.remove);

// --- Staff: roster + detail read, registrar-controlled corrections ---------
// COORDINATOR is department-scoped by departmentScope() inside the service;
// ADMIN sees everything. Recruiter and Faculty scoped reads depend on the
// applications/internships modules (a recruiter only sees applicants to
// their own postings; a mentor only sees their assigned mentees) — deferred
// until those exist rather than half-built here.
const staff = requireRole('COORDINATOR', 'ADMIN');

studentRouter.get('/', staff, student.list);
studentRouter.get('/:id', staff, student.getById);
studentRouter.patch('/:id/academic-record', staff, student.updateAcademicRecord);
