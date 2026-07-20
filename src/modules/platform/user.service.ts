import { prisma } from '../../lib/prisma.ts';
import { ApiError } from '../../lib/http-error.ts';
import type { Prisma } from '../../generated/prisma/client.ts';
import type {
  CreateStaffUserInput,
  SetUserStatusInput,
  UpdateUserInput,
} from './user.schema.ts';

/// Never selects passwordHash. Every read in this module goes through this.
const userSummarySelect = {
  id: true,
  email: true,
  fullName: true,
  phone: true,
  role: true,
  status: true,
  designation: true,
  departmentId: true,
  companyId: true,
  avatarUrl: true,
  lastLoginAt: true,
  createdAt: true,
  department: { select: { id: true, name: true, code: true } },
  company: { select: { id: true, name: true, slug: true } },
} satisfies Prisma.UserSelect;

export interface ListUsersFilters {
  role?: 'STUDENT' | 'RECRUITER' | 'COORDINATOR' | 'FACULTY' | 'ADMIN';
  status?: 'PENDING' | 'ACTIVE' | 'SUSPENDED';
  departmentId?: string;
  companyId?: string;
  q?: string;
  page: number;
  pageSize: number;
}

export async function listUsers(filters: ListUsersFilters) {
  const where: Prisma.UserWhereInput = {
    role: filters.role,
    status: filters.status,
    departmentId: filters.departmentId,
    companyId: filters.companyId,
    ...(filters.q
      ? {
          OR: [
            { fullName: { contains: filters.q, mode: 'insensitive' } },
            // email is citext already — comparisons are case-insensitive at
            // the column level regardless of `mode`.
            { email: { contains: filters.q } },
          ],
        }
      : {}),
  };

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: userSummarySelect,
      orderBy: { createdAt: 'desc' },
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
    }),
  ]);

  return {
    users,
    pagination: {
      page: filters.page,
      pageSize: filters.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / filters.pageSize)),
    },
  };
}

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({ where: { id }, select: userSummarySelect });
  if (!user) throw ApiError.notFound('User not found');
  return user;
}

async function assertDepartmentExists(departmentId: string) {
  const department = await prisma.department.findUnique({
    where: { id: departmentId },
    select: { id: true },
  });
  if (!department) throw ApiError.badRequest('That department does not exist');
}

export async function createStaffUser(input: CreateStaffUserInput) {
  const emailTaken = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });
  if (emailTaken) throw ApiError.conflict('An account with that email already exists');

  if (input.departmentId) await assertDepartmentExists(input.departmentId);

  return prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        email: input.email,
        fullName: input.fullName,
        phone: input.phone ?? null,
        designation: input.designation ?? null,
        role: input.role,
        status: 'ACTIVE',
        departmentId: input.departmentId ?? null,
      },
      select: userSummarySelect,
    });

    if (input.role === 'COORDINATOR' && input.assignAsCoordinator) {
      await tx.department.update({
        where: { id: input.departmentId! },
        data: { coordinatorUserId: created.id },
      });
    }

    return created;
  });
}

export async function updateUser(id: string, input: UpdateUserInput) {
  const user = await getUserById(id);

  if (input.departmentId !== undefined) {
    if (user.role === 'ADMIN') {
      throw ApiError.badRequest('Admin accounts are not scoped to a department');
    }
    if (user.role === 'STUDENT' || user.role === 'RECRUITER') {
      throw ApiError.badRequest(
        "This account's department comes from its student/company record, not from here",
      );
    }
    await assertDepartmentExists(input.departmentId);
  }

  return prisma.user.update({ where: { id }, data: input, select: userSummarySelect });
}

/// PENDING only ever moves to ACTIVE (approval); ACTIVE and SUSPENDED toggle
/// between each other. Nothing moves back to PENDING.
const ALLOWED_STATUS_TRANSITIONS: Record<string, ReadonlyArray<string>> = {
  PENDING: ['ACTIVE'],
  ACTIVE: ['SUSPENDED'],
  SUSPENDED: ['ACTIVE'],
};

export async function setUserStatus(id: string, input: SetUserStatusInput) {
  const user = await getUserById(id);

  const allowed = ALLOWED_STATUS_TRANSITIONS[user.status] ?? [];
  if (!allowed.includes(input.status)) {
    throw ApiError.conflict(
      `Cannot move a ${user.status} account to ${input.status}.` +
        (allowed.length ? ` Allowed next status: ${allowed.join(', ')}.` : ''),
    );
  }

  return prisma.user.update({
    where: { id },
    data: { status: input.status },
    select: userSummarySelect,
  });
}

export async function deleteUser(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      student: {
        select: {
          _count: { select: { applications: true, internships: true, documents: true } },
        },
      },
      menteeRecords: { select: { id: true }, take: 1 },
      coordinatorOf: { select: { id: true, name: true } },
      ticketsRaised: { select: { id: true }, take: 1 },
    },
  });
  if (!user) throw ApiError.notFound('User not found');

  // Deleting a User cascades to Student and everything under it (Prisma
  // schema: student -> user is onDelete: Cascade) — refuse once there's real
  // history rather than silently destroying it. Suspend instead.
  if (user.student) {
    const { applications, internships, documents } = user.student._count;
    if (applications > 0 || internships > 0 || documents > 0) {
      throw ApiError.conflict(
        'This student has application, internship or document history. Suspend the account instead of deleting it.',
      );
    }
  }

  if (user.menteeRecords.length > 0) {
    throw ApiError.conflict(
      'This faculty member has mentee records. Reassign mentees before deleting the account.',
    );
  }

  if (user.coordinatorOf) {
    throw ApiError.conflict(
      `This user is the assigned coordinator for ${user.coordinatorOf.name}. Assign a new coordinator first.`,
    );
  }

  // Tickets cascade-delete with their user too (support history has SLA and
  // audit value), so the same "suspend, don't delete" rule applies.
  if (user.ticketsRaised.length > 0) {
    throw ApiError.conflict(
      'This account has raised support tickets. Suspend the account instead of deleting it.',
    );
  }

  await prisma.user.delete({ where: { id } });
}
