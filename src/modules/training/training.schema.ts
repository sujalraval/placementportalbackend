import { z } from 'zod';

export const trainingIdParam = z.object({
  id: z.string().uuid('Not a valid id'),
});

// --- Courses ---

export const createCourseBody = z.object({
  title: z.string().min(3).max(150),
  provider: z.string().max(100).optional().nullable(),
  description: z.string().optional().nullable(),
  category: z.string().max(50).optional().nullable(),
  level: z.string().max(50).optional().nullable(),
  durationHours: z.number().int().min(1).optional().nullable(),
  url: z.string().url().optional().nullable(),
  thumbnailUrl: z.string().url().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const updateProgressBody = z.object({
  progressPct: z.number().int().min(0).max(100),
});

// --- Resources ---

export const createResourceBody = z.object({
  title: z.string().min(3).max(150),
  type: z.string().max(50),
  category: z.string().max(50).optional().nullable(),
  url: z.string().url(),
  description: z.string().optional().nullable(),
});

// --- Mock Interviews ---

export const bookInterviewBody = z.object({
  type: z.string().max(50),
  scheduledAt: z.string().datetime(),
  durationMinutes: z.number().int().min(15).max(120).default(45),
});

export const scoreInterviewBody = z.object({
  score: z.number().min(0).max(100),
  feedback: z.string().max(2000).optional().nullable(),
});

// --- Types ---
export type CreateCourseInput = z.infer<typeof createCourseBody>;
export type UpdateProgressInput = z.infer<typeof updateProgressBody>;
export type CreateResourceInput = z.infer<typeof createResourceBody>;
export type BookInterviewInput = z.infer<typeof bookInterviewBody>;
export type ScoreInterviewInput = z.infer<typeof scoreInterviewBody>;
