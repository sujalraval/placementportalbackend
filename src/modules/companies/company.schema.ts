import { z } from 'zod';

export const companyIdParam = z.object({
  id: z.string().uuid('Not a valid company id'),
});

export const contactIdParam = z.object({
  id: z.string().uuid('Not a valid company id'),
  contactId: z.string().uuid('Not a valid contact id'),
});

export const createCompanyBody = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(120).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric and hyphens'),
  type: z.enum(['DIRECT_EMPLOYER', 'RECRUITMENT_AGENCY', 'INDIVIDUAL_AGENT']).optional(),
  sectorIds: z.array(z.string().uuid('Not a valid sector id')).optional(),
  about: z.string().trim().max(2000).nullable().optional(),
  website: z.string().url().nullable().optional(),
  logoUrl: z.string().url().nullable().optional(),
  employeeCount: z.string().nullable().optional(),
  hqCity: z.string().nullable().optional(),
  hqCountry: z.string().nullable().optional(),
  visibilityScopes: z.array(z.enum(['UNIVERSITY_WIDE', 'DEPARTMENT_ONLY', 'COLLEGE'])).optional(),
  departmentId: z.string().uuid('Not a valid department id').nullable().optional(),
});

export const updateCompanyBody = createCompanyBody
  .partial()
  .refine((v) => Object.keys(v).length > 0, {
    message: 'Provide at least one field to update',
  });

export const createContactBody = z.object({
  name: z.string().trim().min(2).max(120),
  designation: z.string().trim().max(120).nullable().optional(),
  email: z.string().email(),
  phone: z.string().max(20).nullable().optional(),
  isPrimary: z.boolean().optional(),
  isHrHead: z.boolean().optional(),
});

export const updateContactBody = createContactBody
  .partial()
  .refine((v) => Object.keys(v).length > 0, {
    message: 'Provide at least one field to update',
  });

export const upsertMouBody = z.object({
  referenceNo: z.string().trim().min(2).max(50),
  hiringCommitment: z.number().int().positive().nullable().optional(),
  terms: z.string().trim().nullable().optional(),
  validFrom: z.string().datetime({ message: 'Must be a valid ISO datetime' }),
  validTo: z.string().datetime({ message: 'Must be a valid ISO datetime' }),
  signatoryName: z.string().trim().min(2).max(120),
  signatoryDesignation: z.string().trim().nullable().optional(),
  signedAt: z.string().datetime().nullable().optional(),
  isActive: z.boolean().optional(),
});

export const verifyCompanyBody = z.object({
  verificationStatus: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
  isActive: z.boolean().optional(),
});

export type CreateCompanyInput = z.infer<typeof createCompanyBody>;
export type UpdateCompanyInput = z.infer<typeof updateCompanyBody>;
export type CreateContactInput = z.infer<typeof createContactBody>;
export type UpdateContactInput = z.infer<typeof updateContactBody>;
export type UpsertMouInput = z.infer<typeof upsertMouBody>;
export type VerifyCompanyInput = z.infer<typeof verifyCompanyBody>;
