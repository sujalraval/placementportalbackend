import { prisma } from '../../lib/prisma.ts';
import { ApiError } from '../../lib/http-error.ts';
import type { CreateSuccessStoryInput, UpdateStoryStatusInput } from './alumni.schema.ts';

export async function listStories(user: Express.Request['user']) {
  if (!user) throw ApiError.unauthorized();

  const where: any = (user.role === 'ADMIN' || user.role === 'COORDINATOR')
    ? {}
    : { status: 'PUBLISHED' as any };

  return prisma.successStory.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      student: { select: { user: { select: { fullName: true } } } },
      alumni: { select: { fullName: true } }
    }
  });
}

export async function createStory(input: CreateSuccessStoryInput, user: Express.Request['user']) {
  if (user?.role !== 'ADMIN' && user?.role !== 'COORDINATOR') {
    throw ApiError.forbidden('Only admins can create success stories');
  }

  return prisma.successStory.create({
    data: {
      ...input,
      status: 'DRAFT'
    }
  });
}

export async function updateStoryStatus(id: string, input: UpdateStoryStatusInput, user: Express.Request['user']) {
  if (user?.role !== 'ADMIN' && user?.role !== 'COORDINATOR') {
    throw ApiError.forbidden('Only admins can update story status');
  }

  const story = await prisma.successStory.findUnique({ where: { id } });
  if (!story) throw ApiError.notFound('Success story not found');

  const updateData: any = { status: input.status };
  if (input.status === 'PUBLISHED' && story.status !== 'PUBLISHED') {
    updateData.publishedAt = new Date();
  }

  return prisma.successStory.update({
    where: { id },
    data: updateData
  });
}
