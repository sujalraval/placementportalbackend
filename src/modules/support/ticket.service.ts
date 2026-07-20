import crypto from 'node:crypto';
import { prisma } from '../../lib/prisma.ts';
import { ApiError } from '../../lib/http-error.ts';
import type { CreateTicketInput, UpdateTicketStatusInput, AddCommentInput } from './support.schema.ts';

export async function listTickets(user: Express.Request['user']) {
  if (!user) throw ApiError.unauthorized();

  const where = user.role === 'ADMIN' ? {} : { raisedByUserId: user.sub };

  return prisma.ticket.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      raisedBy: { select: { fullName: true, email: true } },
      assignedTo: { select: { fullName: true } }
    }
  });
}

export async function getTicketById(id: string, user: Express.Request['user']) {
  if (!user) throw ApiError.unauthorized();

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      raisedBy: { select: { fullName: true, email: true } },
      assignedTo: { select: { fullName: true } },
      comments: {
        orderBy: { createdAt: 'asc' },
        include: { author: { select: { fullName: true, role: true } } }
      }
    }
  });

  if (!ticket) throw ApiError.notFound('Ticket not found');

  if (user.role !== 'ADMIN' && ticket.raisedByUserId !== user.sub) {
    throw ApiError.forbidden('Not authorized to view this ticket');
  }

  // Filter out internal comments if user is not admin/coordinator
  if (user.role !== 'ADMIN' && user.role !== 'COORDINATOR') {
    ticket.comments = ticket.comments.filter(c => !c.isInternal);
  }

  return ticket;
}

export async function createTicket(input: CreateTicketInput, user: Express.Request['user']) {
  if (!user) throw ApiError.unauthorized();

  const referenceNo = `TKT-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

  return prisma.ticket.create({
    data: {
      ...input,
      referenceNo,
      raisedByUserId: user.sub,
      status: 'OPEN',
    }
  });
}

export async function updateTicketStatus(id: string, input: UpdateTicketStatusInput, user: Express.Request['user']) {
  if (user?.role !== 'ADMIN' && user?.role !== 'COORDINATOR') {
    throw ApiError.forbidden('Only admins and coordinators can update ticket status');
  }

  const data: any = {
    status: input.status,
    resolution: input.resolution,
    assignedToUserId: input.assignedToUserId,
  };

  if (input.status === 'RESOLVED' || input.status === 'CLOSED') {
    data.resolvedAt = new Date();
  }
  if (input.status === 'ESCALATED') {
    data.escalatedAt = new Date();
  }

  return prisma.ticket.update({
    where: { id },
    data
  });
}

export async function addComment(id: string, input: AddCommentInput, user: Express.Request['user']) {
  if (!user) throw ApiError.unauthorized();

  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) throw ApiError.notFound('Ticket not found');

  if (user.role !== 'ADMIN' && user.role !== 'COORDINATOR' && ticket.raisedByUserId !== user.sub) {
    throw ApiError.forbidden('Not authorized to comment on this ticket');
  }

  if (input.isInternal && user.role !== 'ADMIN' && user.role !== 'COORDINATOR') {
    throw ApiError.forbidden('Only admins can make internal comments');
  }

  return prisma.ticketComment.create({
    data: {
      ticketId: id,
      authorUserId: user.sub,
      body: input.body,
      isInternal: input.isInternal,
    }
  });
}
