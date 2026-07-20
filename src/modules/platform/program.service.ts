import { prisma } from '../../lib/prisma.ts';
import { ApiError } from '../../lib/http-error.ts';
import type { CreateProgramInput, UpdateProgramInput } from './program.schema.ts';

export async function listPrograms(departmentId?: string) {
  return prisma.program.findMany({
    where: departmentId ? { departmentId } : undefined,
    orderBy: [{ department: { name: 'asc' } }, { name: 'asc' }],
    include: {
      department: { select: { id: true, name: true, code: true } },
      _count: { select: { students: true } },
    },
  });
}

export async function getProgramById(id: string) {
  const program = await prisma.program.findUnique({
    where: { id },
    include: {
      department: { select: { id: true, name: true, code: true } },
      _count: { select: { students: true } },
    },
  });
  if (!program) throw ApiError.notFound('Program not found');
  return program;
}

async function assertDepartmentExists(departmentId: string) {
  const department = await prisma.department.findUnique({
    where: { id: departmentId },
    select: { id: true },
  });
  if (!department) throw ApiError.badRequest('That department does not exist');
}

export async function createProgram(input: CreateProgramInput) {
  await assertDepartmentExists(input.departmentId);

  const clash = await prisma.program.findUnique({
    where: { departmentId_code: { departmentId: input.departmentId, code: input.code } },
    select: { id: true },
  });
  if (clash) throw ApiError.conflict('That department already has a program with this code');

  return prisma.program.create({ data: input });
}

export async function updateProgram(id: string, input: UpdateProgramInput) {
  const existing = await getProgramById(id);

  if (input.departmentId && input.departmentId !== existing.departmentId) {
    await assertDepartmentExists(input.departmentId);
  }

  if (input.code) {
    const departmentId = input.departmentId ?? existing.departmentId;
    const clash = await prisma.program.findUnique({
      where: { departmentId_code: { departmentId, code: input.code } },
      select: { id: true },
    });
    if (clash && clash.id !== id) {
      throw ApiError.conflict('That department already has a program with this code');
    }
  }

  return prisma.program.update({ where: { id }, data: input });
}

export async function deleteProgram(id: string) {
  const program = await prisma.program.findUnique({
    where: { id },
    include: { _count: { select: { students: true } } },
  });
  if (!program) throw ApiError.notFound('Program not found');

  const { students } = program._count;
  if (students > 0) {
    throw ApiError.conflict(
      `Cannot delete a program with ${students} student(s) enrolled. Reassign them first.`,
    );
  }

  await prisma.program.delete({ where: { id } });
}
