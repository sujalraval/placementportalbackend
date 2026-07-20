import { prisma } from '../../lib/prisma.ts';
import { ApiError } from '../../lib/http-error.ts';
import type { BookInterviewInput, ScoreInterviewInput } from './training.schema.ts';

export async function listInterviews(user: Express.Request['user']) {
  if (!user) throw ApiError.unauthorized();

  const where: any = {};
  if (user.role === 'STUDENT') {
    if (!user.studentId) throw ApiError.forbidden('Student profile missing');
    where.studentId = user.studentId;
  } else if (user.role === 'FACULTY') {
    where.interviewerUserId = user.sub;
  }
  // ADMIN and COORDINATOR see all

  return prisma.mockInterview.findMany({
    where,
    orderBy: { scheduledAt: 'asc' },
    include: {
      student: { select: { id: true, enrollmentNo: true, user: { select: { fullName: true } } } },
      interviewer: { select: { fullName: true } }
    }
  });
}

export async function bookInterview(input: BookInterviewInput, user: Express.Request['user']) {
  if (user?.role !== 'STUDENT' || !user.studentId) {
    throw ApiError.forbidden('Only students can book mock interviews');
  }

  return prisma.mockInterview.create({
    data: {
      studentId: user.studentId,
      type: input.type,
      scheduledAt: new Date(input.scheduledAt),
      durationMinutes: input.durationMinutes,
      status: 'BOOKED',
    }
  });
}

export async function scoreInterview(id: string, input: ScoreInterviewInput, user: Express.Request['user']) {
  const interview = await prisma.mockInterview.findUnique({ where: { id } });
  if (!interview) throw ApiError.notFound('Mock interview not found');

  if (user?.role !== 'ADMIN' && user?.role !== 'COORDINATOR' && interview.interviewerUserId !== user?.sub) {
    throw ApiError.forbidden('Not authorized to score this interview');
  }

  return prisma.mockInterview.update({
    where: { id },
    data: {
      score: input.score,
      feedback: input.feedback,
      status: 'COMPLETED'
    }
  });
}
