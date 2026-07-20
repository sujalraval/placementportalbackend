import { z } from 'zod';

// --- Shared ---

export const resourceIdParam = z.object({
  id: z.string().uuid('Not a valid id'),
});

// --- Tickets ---

export const createTicketBody = z.object({
  category: z.string().min(2).max(50),
  subject: z.string().min(5).max(150),
  description: z.string().min(10).max(5000),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
});

export const updateTicketStatusBody = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'ESCALATED', 'CLOSED']),
  resolution: z.string().max(2000).optional().nullable(),
  assignedToUserId: z.string().uuid().optional().nullable(),
});

export const addCommentBody = z.object({
  body: z.string().min(2).max(3000),
  isInternal: z.boolean().default(false),
});

// --- Surveys ---

export const createSurveyBody = z.object({
  title: z.string().min(3).max(150),
  description: z.string().max(1000).optional().nullable(),
  audience: z.enum(['STUDENTS', 'RECRUITERS', 'ALUMNI', 'FACULTY', 'ALL']),
  opensAt: z.string().datetime().optional().nullable(),
  closesAt: z.string().datetime().optional().nullable(),
});

export const addQuestionBody = z.object({
  sequence: z.number().int().min(1),
  text: z.string().min(5).max(500),
  type: z.enum(['TEXT', 'MULTIPLE_CHOICE', 'CHECKBOX', 'RATING']),
  options: z.any().optional(), // JSON
  required: z.boolean().default(true),
});

export const submitResponseBody = z.object({
  answers: z.array(z.object({
    questionId: z.string().uuid(),
    value: z.string().min(1).max(5000),
  })).min(1),
});

// --- Types ---

export type CreateTicketInput = z.infer<typeof createTicketBody>;
export type UpdateTicketStatusInput = z.infer<typeof updateTicketStatusBody>;
export type AddCommentInput = z.infer<typeof addCommentBody>;

export type CreateSurveyInput = z.infer<typeof createSurveyBody>;
export type AddQuestionInput = z.infer<typeof addQuestionBody>;
export type SubmitResponseInput = z.infer<typeof submitResponseBody>;
