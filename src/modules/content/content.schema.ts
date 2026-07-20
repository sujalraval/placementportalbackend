import { z } from 'zod';

export const contentIdParam = z.object({
  id: z.string().uuid('Not a valid id'),
});

export const contentSlugParam = z.object({
  slug: z.string().min(1),
});

// --- News ---

export const createNewsBody = z.object({
  title: z.string().min(3).max(150),
  slug: z.string().min(3).max(150),
  excerpt: z.string().max(500).optional().nullable(),
  body: z.string().min(10),
  category: z.string().max(50).optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
});

export const updateContentStatusBody = z.object({
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
});

// --- Events ---

export const createEventBody = z.object({
  title: z.string().min(3).max(150),
  slug: z.string().min(3).max(150),
  description: z.string().optional().nullable(),
  audience: z.enum(['PUBLIC', 'ALUMNI']).default('PUBLIC'),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime().optional().nullable(),
  venue: z.string().max(255).optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
});

// --- Broadcasts ---

export const createBroadcastBody = z.object({
  title: z.string().min(3).max(150),
  body: z.string().min(10),
  audience: z.enum(['STUDENTS', 'ALUMNI', 'FACULTY', 'ALL']),
});

// --- Types ---
export type CreateNewsInput = z.infer<typeof createNewsBody>;
export type CreateEventInput = z.infer<typeof createEventBody>;
export type CreateBroadcastInput = z.infer<typeof createBroadcastBody>;
export type UpdateContentStatusInput = z.infer<typeof updateContentStatusBody>;
