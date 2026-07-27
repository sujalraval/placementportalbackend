import { z } from 'zod';

export const programIdParam = z.object({
  id: z.uuid('Not a valid program id'),
});

export const listProgramsQuery = z.object({
  /// The student registration form needs "programs in this department" —
  /// filtering here means the client never has to fetch the whole catalogue.
  departmentId: z.uuid().optional(),
});

export const createProgramBody = z.object({
  departmentId: z.uuid('Pick a department'),
  name: z.string().trim().min(2).max(160),
  code: z
    .string()
    .trim()
    .min(1)
    .max(16)
    .regex(/^[A-Z0-9_-]+$/, 'Code must be upper-case letters, digits, _ or -'),
  degreeLevel: z.string().trim().min(2).max(40),
  durationYears: z.number().int().min(1).max(10),
  totalSemesters: z.number().int().min(1).max(20),
  skills: z.array(z.string()).optional(),
  sectors: z.array(z.string()).optional(),
  subSectors: z.array(z.string()).optional(),
  industry: z.array(z.string()).optional(),
  domain: z.array(z.string()).optional(),
  subDomain: z.array(z.string()).optional(),
});

export const updateProgramBody = createProgramBody
  .partial()
  .refine((v) => Object.keys(v).length > 0, {
    message: 'Provide at least one field to update',
  });

export type CreateProgramInput = z.infer<typeof createProgramBody>;
export type UpdateProgramInput = z.infer<typeof updateProgramBody>;
