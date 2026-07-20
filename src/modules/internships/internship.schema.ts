import { z } from 'zod';

export const internshipPostingIdParam = z.object({
  id: z.string().uuid('Not a valid internship posting id'),
});

export const internshipIdParam = z.object({
  id: z.string().uuid('Not a valid internship id'),
});

export const getInternshipsQuery = z.object({
  internshipPostingId: z.string().uuid().optional(),
});

export const createInternshipPostingBody = z.object({
  companyId: z.string().uuid('Not a valid company id').optional(), // Required if ADMIN/COORDINATOR
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(5000).nullable().optional(),
  isPaid: z.boolean().default(false),
  stipendAmount: z.number().min(0).nullable().optional(),
  affiliation: z.enum(['WITH_COLLEGE', 'INDEPENDENT']).default('INDEPENDENT'),
  minDurationWeeks: z.number().int().min(1),
  location: z.string().trim().max(120).nullable().optional(),
  mode: z.string().trim().max(50).nullable().optional(),
  openings: z.number().int().min(1).default(1),
  
  visibilityScope: z.enum(['UNIVERSITY_WIDE', 'DEPARTMENT_ONLY']).optional(),
  departmentId: z.string().uuid().nullable().optional(),
  
  startDate: z.string().datetime().nullable().optional(),
  applicationDeadline: z.string().datetime().nullable().optional(),
});

export const updateInternshipPostingBody = createInternshipPostingBody
  .partial()
  .refine((v) => Object.keys(v).length > 0, {
    message: 'Provide at least one field to update',
  });

export const updateInternshipPostingStatusBody = z.object({
  status: z.enum(['DRAFT', 'PENDING_APPROVAL', 'PUBLISHED', 'CLOSED']),
});

export const applyInternshipBody = z.object({
  internshipPostingId: z.string().uuid('Not a valid internship posting id'),
});

export const updateInternshipStageBody = z.object({
  stage: z.enum(['SELECTED', 'ONGOING', 'COMPLETED', 'REJECTED']),
});

export const requestApprovalBody = z.object({
  requestNote: z.string().trim().max(2000).nullable().optional(),
  // Required if WITH_COLLEGE
  courseCode: z.string().trim().max(50).nullable().optional(),
  creditCount: z.number().int().min(0).nullable().optional(),
  evaluationBasis: z.string().trim().max(2000).nullable().optional(),
});

export const decideApprovalBody = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  remarks: z.string().trim().max(2000).nullable().optional(),
  facultyUserId: z.string().uuid('Must provide a faculty user ID if approved').optional(),
});

export const submitReportBody = z.object({
  objectives: z.string().trim().min(10).max(5000),
  summary: z.string().trim().min(10).max(5000),
  learnings: z.string().trim().min(10).max(5000),
  attachmentUrl: z.string().url().nullable().optional(),
});

export const evaluateInternshipBody = z.object({
  grade: z.string().trim().max(10).nullable().optional(),
  marks: z.number().min(0).nullable().optional(),
  remarks: z.string().trim().max(2000).nullable().optional(),
});

export type CreateInternshipPostingInput = z.infer<typeof createInternshipPostingBody>;
export type UpdateInternshipPostingInput = z.infer<typeof updateInternshipPostingBody>;
export type UpdateInternshipPostingStatusInput = z.infer<typeof updateInternshipPostingStatusBody>;
export type ApplyInternshipInput = z.infer<typeof applyInternshipBody>;
export type UpdateInternshipStageInput = z.infer<typeof updateInternshipStageBody>;
export type RequestApprovalInput = z.infer<typeof requestApprovalBody>;
export type DecideApprovalInput = z.infer<typeof decideApprovalBody>;
export type SubmitReportInput = z.infer<typeof submitReportBody>;
export type EvaluateInternshipInput = z.infer<typeof evaluateInternshipBody>;
