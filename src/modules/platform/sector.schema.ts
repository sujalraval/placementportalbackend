import { z } from 'zod';

export const sectorIdParam = z.object({
  id: z.uuid('Not a valid sector id'),
});

export const createSectorBody = z.object({
  name: z.string().trim().min(2).max(120),
  code: z
    .string()
    .trim()
    .min(2)
    .max(16)
    .regex(/^[A-Z0-9_-]+$/, 'Code must be upper-case letters, digits, _ or -')
    .optional(),
  industryRelevance: z.array(z.string().trim().min(1)).optional(),
  industryDomains: z.array(z.string().trim().min(1)).min(1, 'At least one Industry Domain is required'),
  industrySubDomains: z.array(z.string().trim().min(1)).min(1, 'At least one Industry Sub-Domain is required'),
  applicationAreas: z.array(z.string().trim().min(1)).min(1, 'At least one Application Area is required'),
});

export const updateSectorBody = createSectorBody
  .partial()
  .refine((v) => Object.keys(v).length > 0, {
    message: 'Provide at least one field to update',
  });

export type CreateSectorInput = z.infer<typeof createSectorBody>;
export type UpdateSectorInput = z.infer<typeof updateSectorBody>;
