import { z } from 'zod';

/// Request/response shapes for the department registry. Every module keeps its
/// zod schemas here so the controller never hand-rolls validation.

export const departmentIdParam = z.object({
  id: z.uuid('Not a valid department id'),
});

export const createDepartmentBody = z.object({
  name: z.string().trim().min(2).max(120),
  code: z
    .string()
    .trim()
    .min(2)
    .max(16)
    .regex(/^[A-Z0-9_-]+$/, 'Code must be upper-case letters, digits, _ or -'),
  about: z.string().trim().max(2000).optional(),
});

/// Every field optional, but reject `{}` — an empty PATCH is almost always a
/// client bug, and silently returning 200 hides it.
export const updateDepartmentBody = createDepartmentBody
  .partial()
  .refine((v) => Object.keys(v).length > 0, {
    message: 'Provide at least one field to update',
  });

export const listDepartmentsQuery = z.object({
  /// Public callers use this to render the department grid.
  withStats: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
});

export type CreateDepartmentInput = z.infer<typeof createDepartmentBody>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentBody>;
