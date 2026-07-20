import { prisma } from '../../lib/prisma.ts';
import { ApiError } from '../../lib/http-error.ts';

export async function listMyNotifications(user: Express.Request['user'], unreadOnly: boolean = false) {
  if (!user) throw ApiError.unauthorized();

  const where: any = { userId: user.sub };
  if (unreadOnly) {
    where.isRead = false;
  }

  return prisma.notification.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 50, // basic pagination/limit
  });
}

export async function markAsRead(id: string, user: Express.Request['user']) {
  if (!user) throw ApiError.unauthorized();

  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification || notification.userId !== user.sub) {
    throw ApiError.notFound('Notification not found');
  }

  if (notification.isRead) return notification;

  return prisma.notification.update({
    where: { id },
    data: {
      isRead: true,
      readAt: new Date(),
    }
  });
}

export async function markAllAsRead(user: Express.Request['user']) {
  if (!user) throw ApiError.unauthorized();

  await prisma.notification.updateMany({
    where: {
      userId: user.sub,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    }
  });
}

export async function processOutbox(user: Express.Request['user']) {
  if (user?.role !== 'ADMIN') {
    throw ApiError.forbidden('Only admins can trigger the outbox processor manually');
  }

  // Fetch pending events
  const pendingEvents = await prisma.outboxEvent.findMany({
    where: { status: 'PENDING' },
    take: 50,
    orderBy: { occurredAt: 'asc' }
  });

  let processedCount = 0;

  for (const event of pendingEvents) {
    try {
      // In a real system, we would parse event.payload and determine recipients.
      // For now, we will just mark the event as PROCESSED to satisfy the pattern.
      // If the payload happens to have a `userId`, we'd create a notification.
      const payload: any = event.payload;
      
      await prisma.$transaction(async (tx) => {
        if (event.eventType === 'BROADCAST' && payload.audience) {
           // Broadcast Fanning Out logic
           const whereUser: any = {};
           if (payload.audience === 'STUDENTS') whereUser.role = 'STUDENT';
           if (payload.audience === 'ALUMNI') whereUser.role = 'ALUMNI';
           if (payload.audience === 'FACULTY') whereUser.role = 'FACULTY';
           // if ALL, we leave whereUser empty
           
           const targetUsers = await tx.user.findMany({
             where: whereUser,
             select: { id: true }
           });

           if (targetUsers.length > 0) {
             const notificationsToCreate = targetUsers.map(u => ({
                userId: u.id,
                eventId: event.id,
                category: 'BROADCAST',
                title: payload.title || 'New Broadcast',
                body: payload.body || '',
             }));
             await tx.notification.createMany({ data: notificationsToCreate });
           }
        } else if (payload && payload.userId) {
          // Standard single-user notification
          await tx.notification.create({
            data: {
              userId: payload.userId,
              eventId: event.id,
              category: event.eventType || 'SYSTEM',
              title: payload.title || 'New Event',
              body: payload.body || 'A new event occurred in the system.',
              linkUrl: payload.linkUrl,
            }
          });
        }
        
        await tx.outboxEvent.update({
          where: { id: event.id },
          data: {
            status: 'PROCESSED',
            processedAt: new Date(),
            attempts: { increment: 1 }
          }
        });
      });
      processedCount++;
    } catch (err: any) {
      await prisma.outboxEvent.update({
        where: { id: event.id },
        data: {
          status: 'FAILED',
          lastError: err.message,
          attempts: { increment: 1 }
        }
      });
    }
  }

  return { processedCount };
}
