import { prisma } from '../../lib/prisma.ts';
import { ApiError } from '../../lib/http-error.ts';
import type { CreateDepartmentInput, UpdateDepartmentInput } from './department.schema.ts';

/// Domain logic for the department registry. Knows nothing about HTTP — no
/// req, no res, no status codes. Throws ApiError; the controller and the
/// error middleware turn that into a response.

export async function listDepartments(withStats: boolean) {
  const departments = await prisma.department.findMany({
    orderBy: { name: 'asc' },
    include: {
      coordinator: { select: { id: true, fullName: true, email: true } },
      _count: { select: { programs: true, students: true } },
    },
  });

  if (!withStats) return departments;

  // The public department grid shows a placement rate. Counting placed
  // students per department is one grouped query rather than one per row.
  const placed = await prisma.student.groupBy({
    by: ['departmentId'],
    where: { placementStatus: 'PLACED' },
    _count: { _all: true },
  });
  const placedByDept = new Map(placed.map((p) => [p.departmentId, p._count._all]));

  return departments.map((d) => {
    const total = d._count.students;
    const placedCount = placedByDept.get(d.id) ?? 0;
    return {
      ...d,
      stats: {
        students: total,
        placed: placedCount,
        placementRate: total === 0 ? 0 : Math.round((placedCount / total) * 100),
      },
    };
  });
}

export async function getDepartmentById(id: string) {
  const department = await prisma.department.findUnique({
    where: { id },
    include: {
      coordinator: { select: { id: true, fullName: true, email: true } },
      programs: { orderBy: { name: 'asc' } },
      _count: { select: { students: true } },
    },
  });
  if (!department) throw ApiError.notFound('Department not found');
  return department;
}

export async function createDepartment(input: CreateDepartmentInput) {
  // `name` and `code` are both unique in the schema. Checking first gives a
  // clearer message than a raw P2002, but the constraint is still what
  // actually guarantees it under a race.
  const clash = await prisma.department.findFirst({
    where: { OR: [{ name: input.name }, { code: input.code }] },
    select: { name: true, code: true },
  });
  if (clash) {
    const field = clash.code === input.code ? 'code' : 'name';
    throw ApiError.conflict(`A department with that ${field} already exists`);
  }

  return prisma.department.create({ data: input });
}

export async function updateDepartment(id: string, input: UpdateDepartmentInput) {
  await getDepartmentById(id);
  return prisma.department.update({ where: { id }, data: input });
}

export async function deleteDepartment(id: string) {
  const department = await prisma.department.findUnique({
    where: { id },
    include: { _count: { select: { students: true, programs: true } } },
  });
  if (!department) throw ApiError.notFound('Department not found');

  // `student.department_id` is a hard FK with no cascade — deleting a
  // department out from under a roster would fail at the database anyway.
  // Refuse in a way the client can act on instead.
  const { students, programs } = department._count;
  if (students > 0 || programs > 0) {
    throw ApiError.conflict(
      `Cannot delete a department that still has ${students} student(s) and ${programs} program(s). Reassign them first.`,
    );
  }

  await prisma.department.delete({ where: { id } });
}
