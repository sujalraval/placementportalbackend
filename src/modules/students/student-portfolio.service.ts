import { prisma } from '../../lib/prisma.ts';
import { ApiError } from '../../lib/http-error.ts';
import { recomputeProfileCompleteness } from './student.service.ts';
import type {
  AddSkillInput,
  CreateAchievementInput,
  CreateCertificationInput,
  CreateExperienceInput,
  CreateLinkInput,
  CreatePositionInput,
  UpdateAchievementInput,
  UpdateCertificationInput,
  UpdateExperienceInput,
  UpdatePositionInput,
  UpdateProjectInput,
  UpdateSkillInput,
  UpsertSemesterRecordInput,
} from './student-portfolio.schema.ts';

/// Every delete/update below scopes on (id, studentId) together and checks
/// the affected row count, rather than fetching first and comparing —
/// one round trip, and a mismatched id 404s the same way a missing one does
/// (never reveals that the row exists under someone else's profile).
async function assertOwned(count: number): Promise<void> {
  if (count === 0) throw ApiError.notFound('Not found');
}

function toDate(value: string | undefined): Date | undefined {
  return value ? new Date(value) : undefined;
}

// --- Links -------------------------------------------------------------------

export const listLinks = (studentId: string) =>
  prisma.studentLink.findMany({ where: { studentId }, orderBy: { createdAt: 'asc' } });

export const createLink = (studentId: string, input: CreateLinkInput) =>
  prisma.studentLink.create({ data: { studentId, ...input } });

export async function deleteLink(studentId: string, id: string) {
  const { count } = await prisma.studentLink.deleteMany({ where: { id, studentId } });
  await assertOwned(count);
}

// --- Skills --------------------------------------------------------------

export const listSkills = (studentId: string) =>
  prisma.studentSkill.findMany({
    where: { studentId },
    include: { skill: true },
    orderBy: { createdAt: 'asc' },
  });

/// Finds-or-creates the canonical Skill row (citext-unique on name, so
/// "React"/"react" collide), then links it to the student. Calling this again
/// for a skill the student already has just updates the proficiency —
/// there's no separate "edit" flow to discover.
export async function addSkill(studentId: string, input: AddSkillInput) {
  const skill = await prisma.skill.upsert({
    where: { name: input.name },
    create: { name: input.name },
    update: {},
  });

  const studentSkill = await prisma.studentSkill.upsert({
    where: { studentId_skillId: { studentId, skillId: skill.id } },
    create: { studentId, skillId: skill.id, proficiency: input.proficiency },
    update: { proficiency: input.proficiency },
    include: { skill: true },
  });

  await recomputeProfileCompleteness(studentId);
  return studentSkill;
}

export async function updateSkillProficiency(
  studentId: string,
  skillId: string,
  input: UpdateSkillInput,
) {
  const { count } = await prisma.studentSkill.updateMany({
    where: { studentId, skillId },
    data: { proficiency: input.proficiency },
  });
  await assertOwned(count);
  return prisma.studentSkill.findUniqueOrThrow({
    where: { studentId_skillId: { studentId, skillId } },
    include: { skill: true },
  });
}

export async function removeSkill(studentId: string, skillId: string) {
  const { count } = await prisma.studentSkill.deleteMany({ where: { studentId, skillId } });
  await assertOwned(count);
  await recomputeProfileCompleteness(studentId);
}

// --- Projects ------------------------------------------------------------

export const listProjects = (studentId: string) =>
  prisma.studentProject.findMany({ where: { studentId }, orderBy: { createdAt: 'desc' } });

export async function createProject(studentId: string, input: any) {
  const project = await prisma.studentProject.create({
    data: {
      studentId,
      ...input,
      startedOn: toDate(input.startedOn),
      endedOn: toDate(input.endedOn),
    },
  });
  await recomputeProfileCompleteness(studentId);
  return project;
}

export async function updateProject(studentId: string, id: string, input: UpdateProjectInput) {
  const { count } = await prisma.studentProject.updateMany({
    where: { id, studentId },
    data: { ...input, startedOn: toDate(input.startedOn), endedOn: toDate(input.endedOn) },
  });
  await assertOwned(count);
  return prisma.studentProject.findUniqueOrThrow({ where: { id } });
}

export async function deleteProject(studentId: string, id: string) {
  const { count } = await prisma.studentProject.deleteMany({ where: { id, studentId } });
  await assertOwned(count);
  await recomputeProfileCompleteness(studentId);
}

// --- Experience ------------------------------------------------------------

export const listExperiences = (studentId: string) =>
  prisma.studentExperience.findMany({ where: { studentId }, orderBy: { startedOn: 'desc' } });

export async function createExperience(studentId: string, input: CreateExperienceInput) {
  const experience = await prisma.studentExperience.create({
    data: {
      studentId,
      ...input,
      startedOn: new Date(input.startedOn),
      endedOn: toDate(input.endedOn),
    },
  });
  await recomputeProfileCompleteness(studentId);
  return experience;
}

export async function updateExperience(
  studentId: string,
  id: string,
  input: UpdateExperienceInput,
) {
  const { count } = await prisma.studentExperience.updateMany({
    where: { id, studentId },
    data: { ...input, startedOn: toDate(input.startedOn), endedOn: toDate(input.endedOn) },
  });
  await assertOwned(count);
  return prisma.studentExperience.findUniqueOrThrow({ where: { id } });
}

export async function deleteExperience(studentId: string, id: string) {
  const { count } = await prisma.studentExperience.deleteMany({ where: { id, studentId } });
  await assertOwned(count);
  await recomputeProfileCompleteness(studentId);
}

// --- Certifications --------------------------------------------------------

export const listCertifications = (studentId: string) =>
  prisma.studentCertification.findMany({ where: { studentId }, orderBy: { issuedOn: 'desc' } });

export const createCertification = (studentId: string, input: CreateCertificationInput) =>
  prisma.studentCertification.create({
    data: {
      studentId,
      ...input,
      issuedOn: toDate(input.issuedOn),
      expiresOn: toDate(input.expiresOn),
    },
  });

export async function updateCertification(
  studentId: string,
  id: string,
  input: UpdateCertificationInput,
) {
  const { count } = await prisma.studentCertification.updateMany({
    where: { id, studentId },
    data: { ...input, issuedOn: toDate(input.issuedOn), expiresOn: toDate(input.expiresOn) },
  });
  await assertOwned(count);
  return prisma.studentCertification.findUniqueOrThrow({ where: { id } });
}

export async function deleteCertification(studentId: string, id: string) {
  const { count } = await prisma.studentCertification.deleteMany({ where: { id, studentId } });
  await assertOwned(count);
}

// --- Achievements ------------------------------------------------------------

export const listAchievements = (studentId: string) =>
  prisma.studentAchievement.findMany({ where: { studentId }, orderBy: { achievedOn: 'desc' } });

export const createAchievement = (studentId: string, input: CreateAchievementInput) =>
  prisma.studentAchievement.create({
    data: { studentId, ...input, achievedOn: toDate(input.achievedOn) },
  });

export async function updateAchievement(
  studentId: string,
  id: string,
  input: UpdateAchievementInput,
) {
  const { count } = await prisma.studentAchievement.updateMany({
    where: { id, studentId },
    data: { ...input, achievedOn: toDate(input.achievedOn) },
  });
  await assertOwned(count);
  return prisma.studentAchievement.findUniqueOrThrow({ where: { id } });
}

export async function deleteAchievement(studentId: string, id: string) {
  const { count } = await prisma.studentAchievement.deleteMany({ where: { id, studentId } });
  await assertOwned(count);
}

// --- Positions of responsibility --------------------------------------------

export const listPositions = (studentId: string) =>
  prisma.studentPosition.findMany({ where: { studentId }, orderBy: { startedOn: 'desc' } });

export async function createPosition(studentId: string, input: CreatePositionInput) {
  const position = await prisma.studentPosition.create({
    data: {
      studentId,
      ...input,
      startedOn: toDate(input.startedOn),
      endedOn: toDate(input.endedOn),
    },
  });
  await recomputeProfileCompleteness(studentId);
  return position;
}

export async function updatePosition(
  studentId: string,
  id: string,
  input: UpdatePositionInput,
) {
  const { count } = await prisma.studentPosition.updateMany({
    where: { id, studentId },
    data: { ...input, startedOn: toDate(input.startedOn), endedOn: toDate(input.endedOn) },
  });
  await assertOwned(count);
  return prisma.studentPosition.findUniqueOrThrow({ where: { id } });
}

export async function deletePosition(studentId: string, id: string) {
  const { count } = await prisma.studentPosition.deleteMany({ where: { id, studentId } });
  await assertOwned(count);
  await recomputeProfileCompleteness(studentId);
}

// --- Semester records --------------------------------------------------------

export const listSemesterRecords = (studentId: string) =>
  prisma.semesterRecord.findMany({ where: { studentId }, orderBy: { semester: 'asc' } });

export async function upsertSemesterRecord(studentId: string, input: UpsertSemesterRecordInput) {
  const record = await prisma.semesterRecord.upsert({
    where: { studentId_semester: { studentId, semester: input.semester } },
    create: { studentId, ...input },
    update: input,
  });
  await recomputeProfileCompleteness(studentId);
  return record;
}

export async function deleteSemesterRecord(studentId: string, semester: number) {
  const { count } = await prisma.semesterRecord.deleteMany({ where: { studentId, semester } });
  await assertOwned(count);
  await recomputeProfileCompleteness(studentId);
}
