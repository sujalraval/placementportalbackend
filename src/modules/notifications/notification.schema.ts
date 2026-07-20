import { z } from 'zod';

export const notificationIdParam = z.object({
  id: z.string().uuid('Not a valid notification id'),
});

export const getNotificationsQuery = z.object({
  unreadOnly: z.enum(['true', 'false']).optional().transform(v => v === 'true'),
});

export type GetNotificationsQuery = z.infer<typeof getNotificationsQuery>;
