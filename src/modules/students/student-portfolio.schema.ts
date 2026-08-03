import { z } from 'zod';

export const itemIdParam = z.object({
  itemId: z.uuid('Not a valid id'),
});

// --- Links -------------------------------------------------------------------

export const createLinkBody = z.object({
  label: z.string().trim().min(1).max(60),
  url: z.url('Not a valid URL'),
});

// --- Skills --------------------------------------------------------------
// Skills are a shared registry (see the `skill` table) so the recruiter's
// match-score skills-overlap term is a join, not a string compare. Adding a
// skill to a profile means "find or create the canonical row, then link it".

export const addSkillBody = z.object({
  name: z.string().trim().min(1).max(60),
  proficiency: z.number().int().min(1).max(5).default(3),
});

export const updateSkillBody = z.object({
  proficiency: z.number().int().min(1).max(5),
});

// --- Projects ------------------------------------------------------------

export const createProjectBody = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(2000).optional(),
  techStack: z.array(z.string().trim().min(1).max(40)).max(30).default([]),
  repoUrl: z.url().optional(),
  liveUrl: z.url().optional(),
  startedOn: z.iso.date().optional(),
  endedOn: z.iso.date().optional(),
});

export const updateProjectBody = createProjectBody
  .partial()
  .refine((v) => Object.keys(v).length > 0, {
    message: 'Provide at least one field to update',
  });

// --- Experience ------------------------------------------------------------

export const createExperienceBody = z.object({
  organisation: z.string().trim().min(1).max(160),
  role: z.string().trim().min(1).max(120),
  employmentType: z.string().trim().max(255).optional(),
  location: z.string().trim().max(120).optional(),
  startedOn: z.iso.date(),
  endedOn: z.iso.date().optional(),
  isCurrent: z.boolean().default(false),
  description: z.string().trim().max(2000).optional(),
});

export const updateExperienceBody = createExperienceBody
  .partial()
  .refine((v) => Object.keys(v).length > 0, {
    message: 'Provide at least one field to update',
  });

// --- Certifications --------------------------------------------------------

export const createCertificationBody = z.object({
  name: z.string().trim().min(1).max(160),
  issuer: z.string().trim().min(1).max(160),
  issuedOn: z.iso.date().optional(),
  expiresOn: z.iso.date().optional(),
  credentialId: z.string().trim().max(120).optional(),
  credentialUrl: z.url().optional(),
});

export const updateCertificationBody = createCertificationBody
  .partial()
  .refine((v) => Object.keys(v).length > 0, {
    message: 'Provide at least one field to update',
  });

// --- Achievements ------------------------------------------------------------

export const createAchievementBody = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(1000).optional(),
  achievedOn: z.iso.date().optional(),
});

export const updateAchievementBody = createAchievementBody
  .partial()
  .refine((v) => Object.keys(v).length > 0, {
    message: 'Provide at least one field to update',
  });

// --- Positions of responsibility --------------------------------------------

export const createPositionBody = z.object({
  title: z.string().trim().min(1).max(160),
  organisation: z.string().trim().min(1).max(160),
  startedOn: z.iso.date().optional(),
  endedOn: z.iso.date().optional(),
  description: z.string().trim().max(1000).optional(),
});

export const updatePositionBody = createPositionBody
  .partial()
  .refine((v) => Object.keys(v).length > 0, {
    message: 'Provide at least one field to update',
  });

// --- Semester records --------------------------------------------------------
// Upsert by semester number rather than create/update/delete separately — a
// student has at most one record per semester (schema: @@unique([studentId,
// semester])), so "add semester 3" and "correct semester 3" are the same call.

export const upsertSemesterRecordBody = z.object({
  semester: z.number().int().min(1).max(20),
  sgpa: z.number().min(0).max(10),
  credits: z.number().int().min(0).optional(),
  backlogs: z.number().int().min(0).default(0),
});

export type CreateLinkInput = z.infer<typeof createLinkBody>;
export type AddSkillInput = z.infer<typeof addSkillBody>;
export type UpdateSkillInput = z.infer<typeof updateSkillBody>;
export type CreateProjectInput = z.infer<typeof createProjectBody>;
export type UpdateProjectInput = z.infer<typeof updateProjectBody>;
export type CreateExperienceInput = z.infer<typeof createExperienceBody>;
export type UpdateExperienceInput = z.infer<typeof updateExperienceBody>;
export type CreateCertificationInput = z.infer<typeof createCertificationBody>;
export type UpdateCertificationInput = z.infer<typeof updateCertificationBody>;
export type CreateAchievementInput = z.infer<typeof createAchievementBody>;
export type UpdateAchievementInput = z.infer<typeof updateAchievementBody>;
export type CreatePositionInput = z.infer<typeof createPositionBody>;
export type UpdatePositionInput = z.infer<typeof updatePositionBody>;
export type UpsertSemesterRecordInput = z.infer<typeof upsertSemesterRecordBody>;
