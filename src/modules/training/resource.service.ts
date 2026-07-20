import { prisma } from '../../lib/prisma.ts';
import { ApiError } from '../../lib/http-error.ts';
import type { CreateResourceInput } from './training.schema.ts';

export async function listResources(user: Express.Request['user']) {
  if (!user) throw ApiError.unauthorized();

  return prisma.resource.findMany({
    orderBy: { createdAt: 'desc' }
  });
}

export async function createResource(input: CreateResourceInput, user: Express.Request['user']) {
  if (user?.role !== 'ADMIN' && user?.role !== 'COORDINATOR') {
    throw ApiError.forbidden('Only admins can create resources');
  }

  return prisma.resource.create({
    data: input
  });
}
