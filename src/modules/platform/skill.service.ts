import { prisma } from '../../lib/prisma.ts';
import { ApiError } from '../../lib/http-error.ts';
import type { CreateSkillInput, UpdateSkillInput } from './skill.schema.ts';

export async function listSkills() {
  return prisma.skill.findMany({
    orderBy: { name: 'asc' },
  });
}

export async function getSkillById(id: string) {
  const skill = await prisma.skill.findUnique({ where: { id } });
  if (!skill) throw ApiError.notFound('Skill not found');
  return skill;
}

export async function createSkill(input: CreateSkillInput) {
  const clash = await prisma.skill.findUnique({
    where: { name: input.name },
    select: { id: true },
  });
  if (clash) throw ApiError.conflict('A skill with that name already exists');

  return prisma.skill.create({ data: input });
}

export async function updateSkill(id: string, input: UpdateSkillInput) {
  const existing = await getSkillById(id);

  if (input.name && input.name !== existing.name) {
    const clash = await prisma.skill.findUnique({
      where: { name: input.name },
      select: { id: true },
    });
    if (clash) throw ApiError.conflict('A skill with that name already exists');
  }

  return prisma.skill.update({ where: { id }, data: input });
}

export async function deleteSkill(id: string) {
  await getSkillById(id);
  // Optional: Check if skill is in use before deleting
  await prisma.skill.delete({ where: { id } });
}
