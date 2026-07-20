import { prisma } from '../../lib/prisma.ts';
import { ApiError } from '../../lib/http-error.ts';
import type { CreateBroadcastInput } from './content.schema.ts';

export async function listBroadcasts(user: Express.Request['user']) {
  if (user?.role !== 'ADMIN' && user?.role !== 'COORDINATOR') {
    throw ApiError.forbidden('Only admins can view broadcast history');
  }

  return prisma.broadcast.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      sentBy: { select: { fullName: true } }
    }
  });
}

export async function sendBroadcast(input: CreateBroadcastInput, user: Express.Request['user']) {
  if (user?.role !== 'ADMIN') {
    throw ApiError.forbidden('Only admins can send broadcasts');
  }

  return prisma.$transaction(async (tx) => {
    const broadcast = await tx.broadcast.create({
      data: {
        ...input,
        sentByUserId: user.sub,
        sentAt: new Date(),
      }
    });

    // Queue the outbox event for the fanning out
    await tx.outboxEvent.create({
      data: {
        eventType: 'BROADCAST',
        aggregateType: 'Broadcast',
        aggregateId: broadcast.id,
        payload: {
          broadcastId: broadcast.id,
          title: broadcast.title,
          body: broadcast.body,
          audience: broadcast.audience
        },
        status: 'PENDING'
      }
    });

    return broadcast;
  });
}
