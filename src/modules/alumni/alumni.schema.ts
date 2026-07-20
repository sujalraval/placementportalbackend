import { z } from 'zod';

export const alumniIdParam = z.object({
  id: z.string().uuid('Not a valid id'),
});

export const requestTypeParam = z.object({
  type: z.enum(['mentorship', 'referral']),
  id: z.string().uuid(),
});

// --- Profiles ---

export const createAlumniBody = z.object({
  fullName: z.string().min(2).max(100),
  email: z.string().email().optional().nullable(),
  batchYear: z.number().int().min(1950).max(2100),
  departmentName: z.string().max(100).optional().nullable(),
  currentCompany: z.string().max(100).optional().nullable(),
  currentRole: z.string().max(100).optional().nullable(),
  location: z.string().max(100).optional().nullable(),
  linkedinUrl: z.string().url().optional().nullable(),
  photoUrl: z.string().url().optional().nullable(),
  isMentor: z.boolean().default(false),
  isOpenToReferrals: z.boolean().default(false),
});

export const updateAlumniBody = createAlumniBody.partial();

// --- Requests ---

export const createMentorshipRequestBody = z.object({
  alumniId: z.string().uuid(),
  message: z.string().max(2000).optional().nullable(),
});

export const createReferralRequestBody = z.object({
  alumniId: z.string().uuid(),
  jobPostingId: z.string().uuid().optional().nullable(),
  companyName: z.string().max(100).optional().nullable(),
  message: z.string().max(2000).optional().nullable(),
});

export const updateRequestStatusBody = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN']),
});

// --- Stories ---

export const createSuccessStoryBody = z.object({
  title: z.string().min(3).max(150),
  body: z.string().min(10),
  studentId: z.string().uuid().optional().nullable(),
  alumniId: z.string().uuid().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
});

export const updateStoryStatusBody = z.object({
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
});

// --- Types ---
export type CreateAlumniInput = z.infer<typeof createAlumniBody>;
export type UpdateAlumniInput = z.infer<typeof updateAlumniBody>;
export type CreateMentorshipRequestInput = z.infer<typeof createMentorshipRequestBody>;
export type CreateReferralRequestInput = z.infer<typeof createReferralRequestBody>;
export type UpdateRequestStatusInput = z.infer<typeof updateRequestStatusBody>;
export type CreateSuccessStoryInput = z.infer<typeof createSuccessStoryBody>;
export type UpdateStoryStatusInput = z.infer<typeof updateStoryStatusBody>;
