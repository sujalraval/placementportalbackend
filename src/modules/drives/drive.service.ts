import crypto from 'node:crypto';
import { prisma } from '../../lib/prisma.ts';
import { ApiError } from '../../lib/http-error.ts';
import type {
  CreateDriveInput,
  UpdateDriveInput,
  UpdateDriveStatusInput,
  MarkAttendanceInput,
} from './drive.schema.ts';

function buildVisibilityFilter(user: Express.Request['user']): any {
  if (!user) throw ApiError.unauthorized();
  if (user.role === 'ADMIN') return {};
  if (user.role === 'RECRUITER') {
    if (!user.companyId) throw ApiError.forbidden('No company scope');
    return { companyId: user.companyId };
  }
  
  const deptScope = user.departmentId 
    ? { OR: [{ visibilityScope: 'UNIVERSITY_WIDE' }, { departmentId: user.departmentId }] }
    : { visibilityScope: 'UNIVERSITY_WIDE' };

  if (user.role === 'STUDENT') {
    return {
      status: { in: ['SCHEDULED', 'ONGOING', 'COMPLETED'] }, // they shouldn't see CANCELLED unless they registered maybe? 
      ...deptScope
    };
  }
  return deptScope;
}

function checkDriveWriteAccess(user: Express.Request['user'], companyId: string) {
  if (!user) throw ApiError.unauthorized();
  if (user.role === 'ADMIN' || user.role === 'COORDINATOR') return;
  if (user.role === 'RECRUITER') {
    if (user.companyId !== companyId) {
      throw ApiError.forbidden('You can only modify your own company drives');
    }
    return;
  }
  throw ApiError.forbidden('Not authorized to modify this drive');
}

export async function listDrives(user: Express.Request['user']) {
  const where = buildVisibilityFilter(user);
  return prisma.drive.findMany({
    where,
    orderBy: { driveDate: 'asc' },
    include: {
      company: { select: { id: true, name: true, logoUrl: true } }
    }
  });
}

export async function getDriveById(id: string, user: Express.Request['user']) {
  const where = { id, ...buildVisibilityFilter(user) };
  const drive = await prisma.drive.findFirst({
    where,
    include: {
      company: { select: { id: true, name: true, logoUrl: true, about: true } },
      department: { select: { id: true, name: true } },
    }
  });

  if (!drive) throw ApiError.notFound('Drive not found or not accessible');
  return drive;
}

export async function createDrive(input: CreateDriveInput, user: Express.Request['user']) {
  if (!user) throw ApiError.unauthorized();
  
  let companyId = input.companyId;
  if (user.role === 'RECRUITER') {
    companyId = user.companyId!;
  } else if (user.role === 'ADMIN' || user.role === 'COORDINATOR') {
    if (!companyId) throw ApiError.badRequest('companyId is required for admins creating drives');
  } else {
    throw ApiError.forbidden('Not authorized to create drives');
  }

  return prisma.drive.create({
    data: {
      ...input,
      companyId: companyId!,
      status: 'SCHEDULED',
      createdByUserId: user.sub,
      driveDate: new Date(input.driveDate),
    }
  });
}

export async function updateDrive(id: string, input: UpdateDriveInput, user: Express.Request['user']) {
  const drive = await prisma.drive.findUnique({ where: { id } });
  if (!drive) throw ApiError.notFound('Drive not found');
  checkDriveWriteAccess(user, drive.companyId);

  return prisma.drive.update({
    where: { id },
    data: {
      ...input,
      driveDate: input.driveDate ? new Date(input.driveDate) : undefined,
    }
  });
}

export async function updateDriveStatus(id: string, input: UpdateDriveStatusInput, user: Express.Request['user']) {
  const drive = await prisma.drive.findUnique({ where: { id } });
  if (!drive) throw ApiError.notFound('Drive not found');
  checkDriveWriteAccess(user, drive.companyId);

  return prisma.drive.update({
    where: { id },
    data: { status: input.status }
  });
}

export async function registerForDrive(id: string, user: Express.Request['user']) {
  if (user?.role !== 'STUDENT' || !user.studentId) {
    throw ApiError.forbidden('Only students can register for drives');
  }

  // Ensure they can see it (visibility / status)
  await getDriveById(id, user);

  const existing = await prisma.driveRegistration.findUnique({
    where: { driveId_studentId: { driveId: id, studentId: user.studentId } }
  });
  if (existing) {
    throw ApiError.conflict('You are already registered for this drive');
  }

  const passCode = `DRV-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

  return prisma.driveRegistration.create({
    data: {
      driveId: id,
      studentId: user.studentId,
      passCode,
    }
  });
}

export async function listRegistrations(driveId: string, user: Express.Request['user']) {
  const drive = await prisma.drive.findUnique({ where: { id: driveId } });
  if (!drive) throw ApiError.notFound('Drive not found');
  checkDriveWriteAccess(user, drive.companyId); // ensures only authorized people can list

  return prisma.driveRegistration.findMany({
    where: { driveId },
    orderBy: { registeredAt: 'desc' },
    include: {
      student: { select: { id: true, enrollmentNo: true, user: { select: { fullName: true } } } }
    }
  });
}

export async function markAttendance(driveId: string, studentId: string, input: MarkAttendanceInput, user: Express.Request['user']) {
  const drive = await prisma.drive.findUnique({ where: { id: driveId } });
  if (!drive) throw ApiError.notFound('Drive not found');
  checkDriveWriteAccess(user, drive.companyId);

  const registration = await prisma.driveRegistration.findUnique({
    where: { driveId_studentId: { driveId, studentId } }
  });
  if (!registration) {
    throw ApiError.notFound('Registration not found');
  }

  return prisma.driveRegistration.update({
    where: { driveId_studentId: { driveId, studentId } },
    data: { attended: input.attended }
  });
}
