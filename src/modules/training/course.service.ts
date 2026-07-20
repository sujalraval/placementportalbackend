import { prisma } from '../../lib/prisma.ts';
import { ApiError } from '../../lib/http-error.ts';
import type { CreateCourseInput, UpdateProgressInput } from './training.schema.ts';

export async function listCourses(user: Express.Request['user']) {
  if (!user) throw ApiError.unauthorized();

  const where = (user.role === 'ADMIN' || user.role === 'COORDINATOR')
    ? {}
    : { isActive: true };

  return prisma.course.findMany({
    where,
    orderBy: { createdAt: 'desc' }
  });
}

export async function createCourse(input: CreateCourseInput, user: Express.Request['user']) {
  if (user?.role !== 'ADMIN' && user?.role !== 'COORDINATOR') {
    throw ApiError.forbidden('Only admins can create courses');
  }

  return prisma.course.create({
    data: input
  });
}

export async function toggleCourseStatus(courseId: string, user: Express.Request['user']) {
  if (user?.role !== 'ADMIN' && user?.role !== 'COORDINATOR') {
    throw ApiError.forbidden('Only admins can toggle course status');
  }

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw ApiError.notFound('Course not found');

  return prisma.course.update({
    where: { id: courseId },
    data: { isActive: !course.isActive }
  });
}

export async function enrollInCourse(courseId: string, user: Express.Request['user']) {
  if (user?.role !== 'STUDENT' || !user.studentId) {
    throw ApiError.forbidden('Only students can enroll in courses');
  }

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw ApiError.notFound('Course not found');
  if (!course.isActive) throw ApiError.forbidden('Course is not active');

  const existing = await prisma.courseEnrollment.findUnique({
    where: { studentId_courseId: { studentId: user.studentId, courseId } }
  });

  if (existing) {
    throw ApiError.conflict('Already enrolled in this course');
  }

  return prisma.courseEnrollment.create({
    data: {
      studentId: user.studentId,
      courseId,
      status: 'ENROLLED'
    }
  });
}

export async function updateEnrollmentProgress(courseId: string, input: UpdateProgressInput, user: Express.Request['user']) {
  if (user?.role !== 'STUDENT' || !user.studentId) {
    throw ApiError.forbidden('Only students can update their progress');
  }

  const enrollment = await prisma.courseEnrollment.findUnique({
    where: { studentId_courseId: { studentId: user.studentId, courseId } }
  });

  if (!enrollment) throw ApiError.notFound('Enrollment not found');

  const data: any = { progressPct: input.progressPct };
  
  if (input.progressPct > 0 && enrollment.status === 'ENROLLED') {
    data.status = 'IN_PROGRESS';
  }
  
  if (input.progressPct === 100 && enrollment.status !== 'COMPLETED') {
    data.status = 'COMPLETED';
    data.completedAt = new Date();
  }

  return prisma.courseEnrollment.update({
    where: { id: enrollment.id },
    data
  });
}
