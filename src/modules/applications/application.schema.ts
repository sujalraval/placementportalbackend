import { z } from 'zod';

export const applicationIdParam = z.object({
  id: z.string().uuid('Not a valid application id'),
});

export const applicationRoundIdParam = z.object({
  id: z.string().uuid('Not a valid application id'),
  roundId: z.string().uuid('Not a valid round id'),
});

export const interviewIdParam = z.object({
  id: z.string().uuid('Not a valid application id'),
  interviewId: z.string().uuid('Not a valid interview id'),
});

export const getApplicationsQuery = z.object({
  jobPostingId: z.string().uuid('jobPostingId is required').optional(),
});

export const createApplicationBody = z.object({
  jobPostingId: z.string().uuid('Not a valid job posting id'),
  coverNote: z.string().trim().max(2000).nullable().optional(),
});

export const updateApplicationStatusBody = z.object({
  status: z.enum(['APPLIED', 'SHORTLISTED', 'INTERVIEW', 'OFFER', 'JOINED', 'REJECTED', 'WITHDRAWN']),
  rejectionReason: z.string().trim().max(1000).nullable().optional(),
});

export const evaluateRoundBody = z.object({
  selectionRoundId: z.string().uuid('Not a valid selection round id'),
  marks: z.number().min(0).nullable().optional(),
  result: z.enum(['PENDING', 'PASS', 'HOLD', 'FAIL']),
  remarks: z.string().trim().max(1000).nullable().optional(),
});

export const scheduleInterviewBody = z.object({
  selectionRoundId: z.string().uuid().nullable().optional(),
  scheduledAt: z.string().datetime(),
  durationMinutes: z.number().int().positive().default(45),
  mode: z.enum(['ON_CAMPUS', 'ONLINE', 'TELEPHONIC', 'OFF_CAMPUS']).default('ON_CAMPUS'),
  venue: z.string().trim().max(255).nullable().optional(),
  meetingUrl: z.string().url().nullable().optional(),
  panelMembers: z.array(z.string().trim()).optional(),
});

export const updateInterviewOutcomeBody = scheduleInterviewBody.partial().extend({
  outcome: z.enum(['SCHEDULED', 'PASSED', 'FAILED', 'NO_SHOW', 'CANCELLED']).optional(),
  feedback: z.string().trim().max(2000).nullable().optional(),
});

export const releaseOfferBody = z.object({
  referenceNo: z.string().trim().min(2).max(120),
  ctc: z.number().positive(),
  ctcCurrency: z.string().max(3).default('INR'),
  designation: z.string().trim().max(120).nullable().optional(),
  location: z.string().trim().max(120).nullable().optional(),
  joiningDate: z.string().datetime().nullable().optional(),
  respondByDate: z.string().datetime().nullable().optional(),
});

export const revokeOfferBody = z.object({
  revokeReason: z.string().trim().max(1000).nullable().optional(),
});

export const respondOfferBody = z.object({
  accept: z.boolean(),
});

export type CreateApplicationInput = z.infer<typeof createApplicationBody>;
export type UpdateApplicationStatusInput = z.infer<typeof updateApplicationStatusBody>;
export type EvaluateRoundInput = z.infer<typeof evaluateRoundBody>;
export type ScheduleInterviewInput = z.infer<typeof scheduleInterviewBody>;
export type UpdateInterviewOutcomeInput = z.infer<typeof updateInterviewOutcomeBody>;
export type ReleaseOfferInput = z.infer<typeof releaseOfferBody>;
export type RevokeOfferInput = z.infer<typeof revokeOfferBody>;
export type RespondOfferInput = z.infer<typeof respondOfferBody>;
