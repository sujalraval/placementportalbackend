import { prisma } from '../../lib/prisma.ts';
import { ApiError } from '../../lib/http-error.ts';
import type { CreateAlumniInput, UpdateAlumniInput } from './alumni.schema.ts';

export async function listProfiles(filters: any, user: Express.Request['user']) {
  if (!user) throw ApiError.unauthorized();

  const where: any = {};
  
  if (filters.isMentor === 'true') where.isMentor = true;
  if (filters.isOpenToReferrals === 'true') where.isOpenToReferrals = true;
  if (filters.batchYear) where.batchYear = parseInt(filters.batchYear);
  if (filters.departmentName) where.departmentName = filters.departmentName;
  if (filters.currentCompany) where.currentCompany = { contains: filters.currentCompany, mode: 'insensitive' };

  return prisma.alumniProfile.findMany({
    where,
    orderBy: { batchYear: 'desc' }
  });
}

export async function createProfile(input: CreateAlumniInput, user: Express.Request['user']) {
  if (user?.role !== 'ADMIN' && user?.role !== 'COORDINATOR') {
    throw ApiError.forbidden('Only admins can create alumni profiles');
  }

  return prisma.alumniProfile.create({
    data: input
  });
}

export async function updateProfile(id: string, input: UpdateAlumniInput, user: Express.Request['user']) {
  if (user?.role !== 'ADMIN' && user?.role !== 'COORDINATOR') {
    throw ApiError.forbidden('Only admins can update alumni profiles');
  }

  const profile = await prisma.alumniProfile.findUnique({ where: { id } });
  if (!profile) throw ApiError.notFound('Alumni profile not found');

  return prisma.alumniProfile.update({
    where: { id },
    data: input
  });
}
