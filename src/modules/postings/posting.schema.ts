import { z } from 'zod';

export const postingIdParam = z.object({
  id: z.string().uuid('Not a valid posting id'),
});

export const roundIdParam = z.object({
  id: z.string().uuid('Not a valid posting id'),
  roundId: z.string().uuid('Not a valid round id'),
});

export const createPostingBody = z.object({
  companyId: z.string().uuid('Not a valid company id').optional(), // Requierd if ADMIN, otherwise inferred from recruiter session
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(5000).nullable().optional(),
  kind: z.enum(['PLACEMENT', 'OJT']).optional(),
  
  location: z.string().trim().max(120).nullable().optional(),
  employmentType: z.string().trim().max(50).nullable().optional(),
  openings: z.number().int().min(1).optional(),
  
  ctcMin: z.number().positive().nullable().optional(),
  ctcMax: z.number().positive().nullable().optional(),
  ctcCurrency: z.string().max(3).optional(),
  
  minCgpa: z.number().min(0).max(10).nullable().optional(),
  maxActiveBacklogs: z.number().int().min(0).nullable().optional(),
  eligibleBatchYears: z.array(z.number().int()).optional(),
  
  visibilityScope: z.enum(['UNIVERSITY_WIDE', 'DEPARTMENT_ONLY']).optional(),
  departmentId: z.string().uuid().nullable().optional(),
  
  applicationDeadline: z.string().datetime().nullable().optional(),
});

export const updatePostingBody = createPostingBody
  .partial()
  .refine((v) => Object.keys(v).length > 0, {
    message: 'Provide at least one field to update',
  });

export const updatePostingStatusBody = z.object({
  status: z.enum(['DRAFT', 'PENDING_APPROVAL', 'PUBLISHED', 'CLOSED']),
});

export const createRoundBody = z.object({
  sequence: z.number().int().min(1),
  name: z.string().trim().min(2).max(120),
  type: z.enum(['APTITUDE', 'TECHNICAL', 'HR', 'GROUP_DISCUSSION', 'MANAGERIAL', 'OTHER']).optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  maxMarks: z.number().int().positive().nullable().optional(),
  cutoffMarks: z.number().int().positive().nullable().optional(),
});

export const updateRoundBody = createRoundBody
  .partial()
  .refine((v) => Object.keys(v).length > 0, {
    message: 'Provide at least one field to update',
  });

export type CreatePostingInput = z.infer<typeof createPostingBody>;
export type UpdatePostingInput = z.infer<typeof updatePostingBody>;
export type UpdatePostingStatusInput = z.infer<typeof updatePostingStatusBody>;
export type CreateRoundInput = z.infer<typeof createRoundBody>;
export type UpdateRoundInput = z.infer<typeof updateRoundBody>;
