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
});

export const updateSectorBody = createSectorBody
  .partial()
  .refine((v) => Object.keys(v).length > 0, {
    message: 'Provide at least one field to update',
  });

export type CreateSectorInput = z.infer<typeof createSectorBody>;
export type UpdateSectorInput = z.infer<typeof updateSectorBody>;
