import { prisma } from '../../lib/prisma.ts';
import { ApiError } from '../../lib/http-error.ts';
import type { CreateNewsInput, UpdateContentStatusInput } from './content.schema.ts';

export async function listNews(user: Express.Request['user']) {
  if (!user) throw ApiError.unauthorized();

  const where: any = (user.role === 'ADMIN' || user.role === 'COORDINATOR')
    ? {} 
    : { status: 'PUBLISHED' as any };

  return prisma.newsItem.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, title: true, slug: true, excerpt: true, 
      category: true, imageUrl: true, status: true, publishedAt: true
    }
  });
}

export async function getNewsBySlug(slug: string, user: Express.Request['user']) {
  if (!user) throw ApiError.unauthorized();

  const news = await prisma.newsItem.findUnique({
    where: { slug },
    include: { author: { select: { fullName: true } } }
  });

  if (!news) throw ApiError.notFound('News item not found');

  if (news.status !== 'PUBLISHED' && user.role !== 'ADMIN' && user.role !== 'COORDINATOR') {
    throw ApiError.notFound('News item not found');
  }

  return news;
}

export async function createNews(input: CreateNewsInput, user: Express.Request['user']) {
  if (user?.role !== 'ADMIN' && user?.role !== 'COORDINATOR') {
    throw ApiError.forbidden('Not authorized to create news');
  }

  const existing = await prisma.newsItem.findUnique({ where: { slug: input.slug } });
  if (existing) throw ApiError.conflict('A news item with this slug already exists');

  return prisma.newsItem.create({
    data: {
      ...input,
      authorUserId: user.sub,
      status: 'DRAFT',
    }
  });
}

export async function updateNewsStatus(id: string, input: UpdateContentStatusInput, user: Express.Request['user']) {
  if (user?.role !== 'ADMIN' && user?.role !== 'COORDINATOR') {
    throw ApiError.forbidden('Not authorized to update news');
  }

  const news = await prisma.newsItem.findUnique({ where: { id } });
  if (!news) throw ApiError.notFound('News item not found');

  const updateData: any = { status: input.status };
  if (input.status === 'PUBLISHED' && news.status !== 'PUBLISHED') {
    updateData.publishedAt = new Date();
  }

  return prisma.newsItem.update({
    where: { id },
    data: updateData
  });
}
