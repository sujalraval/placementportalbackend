import { z } from 'zod';

/// Rejects the passwords that show up in every breach list without pretending
/// to be a strength meter. Length does more work than character classes.
const password = z
  .string()
  .min(10, 'Use at least 10 characters')
  .max(128)
  .refine((v) => !/^\s|\s$/.test(v), 'Cannot start or end with a space');

const email = z.email('Not a valid email address').toLowerCase().trim();

export const loginBody = z.object({
  email,
  password: z.string().min(1, 'Password is required'),
});

/// Mirrors the public site's student registration form: name, enrolment
/// number, department, CGPA, university email, password.
export const registerStudentBody = z.object({
  fullName: z.string().trim().min(2).max(120),
  email,
  password,
  phone: z.string().trim().max(20).optional(),
  enrollmentNo: z.string().trim().min(3).max(32),
  departmentId: z.uuid('Pick a department'),
  programId: z.uuid().optional(),
  batchStartYear: z.number().int().min(1990).max(2100),
  batchEndYear: z.number().int().min(1990).max(2100),
  cgpa: z.number().min(0).max(10).default(0),
});

export const registerStudentRefined = registerStudentBody.refine(
  (v) => v.batchEndYear > v.batchStartYear,
  { message: 'Batch end year must be after the start year', path: ['batchEndYear'] },
);

/// The public site's three-way recruiter branch. Creating the company and the
/// recruiter account is one transaction — the user_role_scope_consistent CHECK
/// means a RECRUITER row cannot exist without a company_id, so there is no
/// valid intermediate state where one exists without the other.
export const registerRecruiterBody = z.object({
  fullName: z.string().trim().min(2).max(120),
  email,
  password,
  phone: z.string().trim().max(20).optional(),
  designation: z.string().trim().max(120).optional(),

  companyName: z.string().trim().min(2).max(160),
  companyType: z.enum(['DIRECT_EMPLOYER', 'RECRUITMENT_AGENCY', 'INDIVIDUAL_AGENT']),
  website: z.url('Not a valid URL').optional(),
  sectorId: z.uuid().optional(),
  hqCity: z.string().trim().max(80).optional(),
  about: z.string().trim().max(2000).optional(),
});

export const refreshBody = z.object({
  refreshToken: z.string().min(1),
});

export const oauthProviderParam = z.object({
  provider: z.enum(['linkedin', 'microsoft']).transform((v) => v.toUpperCase() as
    | 'LINKEDIN'
    | 'MICROSOFT'),
});

export const oauthStartQuery = z.object({
  /// Where to send the browser once the round-trip finishes. Validated against
  /// FRONTEND_URL in the service — an open redirect here would let a provider
  /// callback bounce a real session to an attacker's site.
  returnTo: z.string().optional(),
});

/// Completing OAuth-bootstrapped registration. The ticket carries the verified
/// provider identity; the body carries everything the provider could not tell
/// us — which is most of what the domain actually needs.
export const completeStudentBody = z.object({
  ticket: z.string().min(1),
  enrollmentNo: z.string().trim().min(3).max(32),
  departmentId: z.uuid('Pick a department'),
  programId: z.uuid().optional(),
  batchStartYear: z.number().int().min(1990).max(2100),
  batchEndYear: z.number().int().min(1990).max(2100),
  cgpa: z.number().min(0).max(10).default(0),
  phone: z.string().trim().max(20).optional(),
});

export const completeRecruiterBody = z.object({
  ticket: z.string().min(1),
  companyName: z.string().trim().min(2).max(160),
  companyType: z.enum(['DIRECT_EMPLOYER', 'RECRUITMENT_AGENCY', 'INDIVIDUAL_AGENT']),
  website: z.url().optional(),
  sectorId: z.uuid().optional(),
  hqCity: z.string().trim().max(80).optional(),
  designation: z.string().trim().max(120).optional(),
  phone: z.string().trim().max(20).optional(),
});

export type LoginInput = z.infer<typeof loginBody>;
export type RegisterStudentInput = z.infer<typeof registerStudentBody>;
export type RegisterRecruiterInput = z.infer<typeof registerRecruiterBody>;
export type CompleteStudentInput = z.infer<typeof completeStudentBody>;
export type CompleteRecruiterInput = z.infer<typeof completeRecruiterBody>;
