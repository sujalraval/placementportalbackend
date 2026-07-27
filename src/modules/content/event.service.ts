import { prisma } from '../../lib/prisma.ts';
import { ApiError } from '../../lib/http-error.ts';
import type { CreateEventInput, UpdateContentStatusInput } from './content.schema.ts';

export async function listEvents(user: Express.Request['user']) {
  if (!user) throw ApiError.unauthorized();

  const where: any = {};
  if (user.role !== 'ADMIN' && user.role !== 'COORDINATOR') {
    where.status = 'PUBLISHED';
    where.audience = 'PUBLIC';
  }

  return prisma.eventItem.findMany({
    where,
    orderBy: { startsAt: 'asc' },
    include: { departments: { select: { id: true, name: true } } },
  });
}

export async function getEventBySlug(slug: string, user: Express.Request['user']) {
  if (!user) throw ApiError.unauthorized();

  const event = await prisma.eventItem.findUnique({
    where: { slug },
    include: { departments: { select: { id: true, name: true } } },
  });

  if (!event) throw ApiError.notFound('Event not found');

  if (event.status !== 'PUBLISHED' && user.role !== 'ADMIN' && user.role !== 'COORDINATOR') {
    throw ApiError.notFound('Event not found');
  }

  if (user.role !== 'ADMIN' && user.role !== 'COORDINATOR') {
    if (event.audience === 'ALUMNI') {
      throw ApiError.forbidden('Event not accessible');
    }
  }

  return event;
}

export async function createEvent(input: CreateEventInput, user: Express.Request['user']) {
  if (user?.role !== 'ADMIN' && user?.role !== 'COORDINATOR') {
    throw ApiError.forbidden('Not authorized to create events');
  }

  const existing = await prisma.eventItem.findUnique({ where: { slug: input.slug } });
  if (existing) throw ApiError.conflict('An event with this slug already exists');

  const { departmentIds, ...rest } = input;

  return prisma.eventItem.create({
    data: {
      ...rest,
      startsAt: new Date(input.startsAt),
      endsAt: input.endsAt ? new Date(input.endsAt) : null,
      createdByUserId: user.sub,
      status: 'DRAFT',
      departments: departmentIds && departmentIds.length > 0 ? {
        connect: departmentIds.map(id => ({ id }))
      } : undefined,
    }
  });
}

export async function updateEventStatus(id: string, input: UpdateContentStatusInput, user: Express.Request['user']) {
  if (user?.role !== 'ADMIN' && user?.role !== 'COORDINATOR') {
    throw ApiError.forbidden('Not authorized to update events');
  }

  return prisma.eventItem.update({
    where: { id },
    data: { status: input.status }
  });
}

export async function registerForEvent(eventId: string, user: Express.Request['user']) {
  if (user?.role !== 'STUDENT' || !user.studentId) {
    throw ApiError.forbidden('Only students can register for events');
  }

  const event = await prisma.eventItem.findUnique({ where: { id: eventId } });
  if (!event) throw ApiError.notFound('Event not found');

  if (event.status !== 'PUBLISHED' || event.audience === 'ALUMNI') {
    throw ApiError.forbidden('Event not available for registration');
  }

  const existing = await prisma.eventRegistration.findUnique({
    where: { eventId_studentId: { eventId, studentId: user.studentId } }
  });
  if (existing) {
    throw ApiError.conflict('You are already registered for this event');
  }

  return prisma.eventRegistration.create({
    data: {
      eventId,
      studentId: user.studentId,
    }
  });
}

export async function listRegistrations(eventId: string, user: Express.Request['user']) {
  if (user?.role !== 'ADMIN' && user?.role !== 'COORDINATOR') {
    throw ApiError.forbidden('Not authorized to view registrations');
  }

  return prisma.eventRegistration.findMany({
    where: { eventId },
    include: { student: { select: { id: true, enrollmentNo: true, user: { select: { fullName: true } } } } },
    orderBy: { registeredAt: 'desc' }
  });
}
